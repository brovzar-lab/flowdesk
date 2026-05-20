import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

type ItemCategory = 'produce' | 'protein' | 'dairy' | 'grains' | 'condiments' | 'beverages' | 'other';
type DietaryPref = 'none' | 'vegetarian' | 'vegan';

interface GenerateMealPlanRequest {
  scanId: string;
  dietaryPref?: DietaryPref;
}

interface RecipeRef {
  name: string;
  ingredients: string[];
  prepTimeMinutes: number;
  instructions: string;
}

interface DayMeals {
  day: string;
  breakfast: RecipeRef;
  lunch: RecipeRef;
  dinner: RecipeRef;
}

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: ItemCategory;
  checked: boolean;
}

const VALID_CATEGORIES = new Set<string>([
  'produce', 'protein', 'dairy', 'grains', 'condiments', 'beverages', 'other',
]);

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getMondayISO(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function buildPrompt(
  items: Array<{ name: string; category: string }>,
  pref: DietaryPref
): string {
  const itemList = items.map((i) => `${i.name} (${i.category})`).join(', ');
  const prefText =
    pref === 'vegetarian'
      ? 'vegetarian (no meat or fish; dairy and eggs are fine)'
      : pref === 'vegan'
      ? 'vegan (plant-based only; no animal products)'
      : 'no dietary restrictions (omnivore)';

  return (
    'You are a professional meal planner and chef.\n' +
    `Pantry items available: ${itemList}\n` +
    `Dietary preference: ${prefText}\n\n` +
    'Generate a 7-day meal plan (Monday through Sunday) with breakfast, lunch, and dinner each day.\n' +
    'Maximise use of the available pantry items and minimise waste.\n' +
    'Also generate a shopping list of additional ingredients that are NOT already in the pantry.\n\n' +
    'Return ONLY a valid JSON object — no markdown, no code fences, no extra text — matching this exact schema:\n' +
    '{\n' +
    '  "meals": [\n' +
    '    {\n' +
    '      "day": "Monday",\n' +
    '      "breakfast": { "name": string, "ingredients": string[], "prepTimeMinutes": number, "instructions": string },\n' +
    '      "lunch":     { "name": string, "ingredients": string[], "prepTimeMinutes": number, "instructions": string },\n' +
    '      "dinner":    { "name": string, "ingredients": string[], "prepTimeMinutes": number, "instructions": string }\n' +
    '    }\n' +
    '  ],\n' +
    '  "shoppingList": [\n' +
    '    { "name": string, "quantity": string, "category": "produce"|"protein"|"dairy"|"grains"|"condiments"|"beverages"|"other" }\n' +
    '  ]\n' +
    '}\n\n' +
    'Rules:\n' +
    '- meals must contain exactly 7 items in order: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.\n' +
    '- Each ingredient string should include quantity (e.g. "2 eggs", "1 cup rice", "200g chicken breast").\n' +
    '- instructions should be 2–3 concise sentences.\n' +
    '- prepTimeMinutes must be a positive integer (including cooking time).\n' +
    '- shoppingList must only include items that are NOT in the pantry list above.'
  );
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function sanitizeRecipe(raw: unknown, fallback: string): RecipeRef {
  if (!isObject(raw)) {
    return { name: fallback, ingredients: [], prepTimeMinutes: 15, instructions: '' };
  }
  return {
    name: typeof raw.name === 'string' ? raw.name.trim() : fallback,
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients.filter((i): i is string => typeof i === 'string')
      : [],
    prepTimeMinutes:
      typeof raw.prepTimeMinutes === 'number'
        ? Math.max(1, Math.min(240, Math.round(raw.prepTimeMinutes)))
        : 15,
    instructions: typeof raw.instructions === 'string' ? raw.instructions.trim() : '',
  };
}

function parseMeals(rawMeals: unknown[]): DayMeals[] {
  return DAYS.map((day, i) => {
    const raw = isObject(rawMeals[i]) ? (rawMeals[i] as Record<string, unknown>) : {};
    return {
      day,
      breakfast: sanitizeRecipe(raw.breakfast, 'Breakfast'),
      lunch: sanitizeRecipe(raw.lunch, 'Lunch'),
      dinner: sanitizeRecipe(raw.dinner, 'Dinner'),
    };
  });
}

function parseShoppingList(rawList: unknown[]): ShoppingItem[] {
  return rawList
    .filter(
      (item): item is Record<string, unknown> =>
        isObject(item) && typeof item.name === 'string'
    )
    .map((item, i) => {
      const cat =
        typeof item.category === 'string' && VALID_CATEGORIES.has(item.category)
          ? (item.category as ItemCategory)
          : 'other';
      return {
        id: `shop-${Date.now()}-${i}`,
        name: String(item.name).trim(),
        quantity: typeof item.quantity === 'string' ? item.quantity.trim() : '',
        category: cat,
        checked: false,
      };
    });
}

export const generateMealPlan = functions
  .runWith({ secrets: ['GEMINI_API_KEY'], timeoutSeconds: 120, memory: '256MB' })
  .https.onCall(async (data: GenerateMealPlanRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const { scanId, dietaryPref = 'none' } = data;
    if (!scanId) {
      throw new functions.https.HttpsError('invalid-argument', 'scanId is required.');
    }

    const uid = context.auth.uid;
    const db = admin.firestore();

    // Fetch confirmed pantry items from the scan
    const scanDoc = await db.doc(`users/${uid}/pantryScans/${scanId}`).get();
    if (!scanDoc.exists) {
      throw new functions.https.HttpsError('not-found', `Pantry scan ${scanId} not found.`);
    }

    const scanData = scanDoc.data() ?? {};
    const rawItems: unknown[] = Array.isArray(scanData.detectedItems)
      ? scanData.detectedItems
      : [];

    const confirmedItems = rawItems
      .filter(
        (item): item is { name: string; category: string } =>
          isObject(item) &&
          typeof (item as Record<string, unknown>).name === 'string' &&
          (item as Record<string, unknown>).userConfirmed !== false
      )
      .map((item) => ({ name: item.name.trim(), category: item.category }));

    if (confirmedItems.length === 0) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'No confirmed pantry items found in this scan.'
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new functions.https.HttpsError('internal', 'GEMINI_API_KEY secret not configured.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    });

    const prompt = buildPrompt(confirmedItems, dietaryPref);

    let responseText: string;
    try {
      const result = await model.generateContent(prompt);
      responseText = result.response.text().trim();
    } catch (err) {
      console.error('[generateMealPlan] Gemini API error:', err);
      throw new functions.https.HttpsError('internal', 'LLM call failed. Please try again.');
    }

    // Strip markdown fences if model ignores the instruction
    if (responseText.startsWith('```')) {
      responseText = responseText
        .replace(/^```[a-z]*\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();
    }

    let parsed: { meals?: unknown[]; shoppingList?: unknown[] };
    try {
      parsed = JSON.parse(responseText) as { meals?: unknown[]; shoppingList?: unknown[] };
    } catch {
      console.error('[generateMealPlan] Failed to parse response:', responseText.slice(0, 600));
      throw new functions.https.HttpsError('internal', 'Could not parse meal plan from LLM response.');
    }

    const meals = parseMeals(Array.isArray(parsed.meals) ? parsed.meals : []);
    const shoppingItems = parseShoppingList(
      Array.isArray(parsed.shoppingList) ? parsed.shoppingList : []
    );
    const weekOf = getMondayISO();

    // Write meal plan
    const planRef = db.collection(`users/${uid}/mealPlans`).doc();
    await planRef.set({
      scanId,
      weekOf,
      dietaryPref,
      meals,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Write shopping list
    const listRef = db.collection(`users/${uid}/shoppingLists`).doc();
    await listRef.set({
      planId: planRef.id,
      items: shoppingItems,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { planId: planRef.id, listId: listRef.id };
  });
