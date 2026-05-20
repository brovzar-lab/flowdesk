import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface AnalyzePantryRequest {
  scanId: string;
}

/**
 * Callable function: receives a scanId, fetches the uploaded photo from Storage,
 * sends to Gemini Vision API, parses the item list, writes to Firestore.
 * Photo is deleted after processing (ephemeral scan — privacy + cost).
 *
 * Week 1: stub only. Full implementation wired in Week 2 (Vision AI integration).
 */
export const analyzePantry = functions.https.onCall(
  async (data: AnalyzePantryRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const { scanId } = data;
    if (!scanId) {
      throw new functions.https.HttpsError('invalid-argument', 'scanId is required.');
    }

    const uid = context.auth.uid;
    const db = admin.firestore();

    // Stub: mark scan as done with placeholder items
    // Week 2: replace with Gemini Vision API call
    await db.doc(`users/${uid}/pantryScans/${scanId}`).set(
      {
        status: 'done',
        detectedItems: [],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { scanId, status: 'done', itemCount: 0 };
  }
);
