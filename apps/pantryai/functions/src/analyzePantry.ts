import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface AnalyzePantryRequest {
  scanId: string;
}

type ItemCategory = 'produce' | 'protein' | 'dairy' | 'grains' | 'condiments' | 'beverages' | 'other';

interface DetectedItem {
  id: string;
  name: string;
  confidence: number;
  category: ItemCategory;
  userConfirmed: boolean;
}

const VALID_CATEGORIES = new Set<string>([
  'produce', 'protein', 'dairy', 'grains', 'condiments', 'beverages', 'other',
]);

const VISION_PROMPT =
  'You are analyzing a photo of a refrigerator or pantry.\n' +
  'Identify all visible food items. For each item return:\n' +
  '- name (common name, e.g. "chicken breast", "whole milk", "broccoli")\n' +
  '- confidence (0.0–1.0, how confident you are this item is present)\n' +
  '- category: produce | protein | dairy | grains | condiments | beverages | other\n\n' +
  'Return a JSON array ONLY with no surrounding text and no markdown code fences.\n' +
  'Example: [{"name":"chicken breast","confidence":0.94,"category":"protein"}]\n' +
  'If an item is uncertain, include it with low confidence.\n' +
  'Do not include non-food items.';

export const analyzePantry = functions
  .runWith({ secrets: ['GEMINI_API_KEY'] })
  .https.onCall(async (data: AnalyzePantryRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const { scanId } = data;
    if (!scanId) {
      throw new functions.https.HttpsError('invalid-argument', 'scanId is required.');
    }

    const uid = context.auth.uid;
    const db = admin.firestore();
    const bucket = admin.storage().bucket();
    const storagePath = `scans/${uid}/${scanId}.jpg`;

    try {
      await db.doc(`users/${uid}/pantryScans/${scanId}`).set(
        { status: 'processing', updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );

      const file = bucket.file(storagePath);
      const [imageBuffer] = await file.download();
      const imageBase64 = imageBuffer.toString('base64');

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY secret not configured.');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const result = await model.generateContent([
        VISION_PROMPT,
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
      ]);

      let responseText = result.response.text().trim();
      if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
      }

      let rawItems: unknown[] = [];
      try {
        const parsed: unknown = JSON.parse(responseText);
        if (Array.isArray(parsed)) rawItems = parsed;
      } catch {
        console.warn('[analyzePantry] Unparseable Gemini response:', responseText.slice(0, 300));
      }

      const detectedItems: DetectedItem[] = rawItems
        .filter(
          (item): item is { name: string; confidence: number; category?: unknown } =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as Record<string, unknown>).name === 'string' &&
            typeof (item as Record<string, unknown>).confidence === 'number'
        )
        .map((item, i) => {
          const cat = typeof item.category === 'string' ? item.category : '';
          return {
            id: `item-${scanId}-${i}`,
            name: item.name.trim(),
            confidence: Math.min(1, Math.max(0, item.confidence)),
            category: VALID_CATEGORIES.has(cat) ? (cat as ItemCategory) : 'other',
            userConfirmed: true,
          };
        });

      await db.doc(`users/${uid}/pantryScans/${scanId}`).set(
        {
          status: 'done',
          detectedItems,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Delete image from Storage after processing (privacy + cost)
      try {
        await file.delete();
      } catch (deleteErr) {
        console.warn(`[analyzePantry] Storage cleanup failed for ${storagePath}:`, deleteErr);
      }

      return { scanId, status: 'done', items: detectedItems, itemCount: detectedItems.length };
    } catch (err) {
      console.error('[analyzePantry] Error:', err);

      await db.doc(`users/${uid}/pantryScans/${scanId}`).set(
        {
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      throw new functions.https.HttpsError(
        'internal',
        err instanceof Error ? err.message : 'Failed to analyze pantry photo.'
      );
    }
  });
