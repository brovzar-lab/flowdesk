import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import { File } from 'buffer';

const isMockMode =
  !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'REPLACE_WITH_VALUE';

// POST body: { uid, sessionId, storagePath }
// Returns: { transcript }
export const transcribeVoiceMemo = onRequest(
  {
    ...(isMockMode ? {} : { secrets: ['OPENAI_API_KEY'] }),
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { uid, sessionId, storagePath } = req.body as {
      uid?: string;
      sessionId?: string;
      storagePath?: string;
    };

    if (!uid || !sessionId || !storagePath) {
      res.status(400).json({ error: 'uid, sessionId, and storagePath are required' });
      return;
    }

    const db = admin.firestore();
    const sessionRef = db.doc(`users/${uid}/sessions/${sessionId}`);

    if (isMockMode) {
      const mockTranscript =
        "I've been thinking about this a lot. The thing my manager hasn't seen is how I break down problems before I start building. I have all these planning notes that just live in private. Maybe it's time to make that visible.";
      await sessionRef.set(
        { transcript: mockTranscript, transcribedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      res.json({ transcript: mockTranscript });
      return;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const bucket = admin.storage().bucket();
    const [audioBuffer] = await bucket.file(storagePath).download();

    let transcript = '';
    try {
      const audioFile = new File([audioBuffer], 'audio.m4a', { type: 'audio/mp4' });
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile as unknown as Parameters<typeof openai.audio.transcriptions.create>[0]['file'],
        model: 'whisper-1',
      });
      transcript = transcription.text;
    } catch (err) {
      console.error('Whisper transcription failed:', err);
      res.status(500).json({ error: 'Transcription failed' });
      return;
    }

    await sessionRef.set(
      { transcript, transcribedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    res.json({ transcript });
  }
);
