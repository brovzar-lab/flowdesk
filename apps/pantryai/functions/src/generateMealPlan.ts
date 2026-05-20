import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface GenerateMealPlanRequest {
  scanId: string;
  dietaryPref?: 'none' | 'vegetarian' | 'vegan';
}

/**
 * Callable function: fetches confirmed pantry items from Firestore, sends to
 * Gemini 1.5 Pro for 7-day meal plan generation, writes plan + shopping list.
 *
 * Week 1: stub only. Full implementation wired in Week 3 (Meal Plan generation).
 */
export const generateMealPlan = functions.https.onCall(
  async (data: GenerateMealPlanRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const { scanId, dietaryPref = 'none' } = data;
    if (!scanId) {
      throw new functions.https.HttpsError('invalid-argument', 'scanId is required.');
    }

    const uid = context.auth.uid;
    const db = admin.firestore();

    const monday = getMondayISO();

    // Stub: write empty plan + list
    // Week 3: replace with Gemini 1.5 Pro meal plan generation
    const planRef = db.collection(`users/${uid}/mealPlans`).doc();
    await planRef.set({
      scanId,
      weekOf: monday,
      dietaryPref,
      meals: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const listRef = db.collection(`users/${uid}/shoppingLists`).doc();
    await listRef.set({
      planId: planRef.id,
      items: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { planId: planRef.id, listId: listRef.id };
  }
);

function getMondayISO(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}
