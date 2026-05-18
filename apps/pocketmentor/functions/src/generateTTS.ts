import { onRequest } from 'firebase-functions/v2/https';
import { generateAndUploadTTS } from './ttsUtil';

const isMockMode =
  !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'REPLACE_WITH_VALUE';

// POST body: { uid, sessionId, text, voiceId? }
// Returns: { audioUrl }
export const generateTTS = onRequest(
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

    const {
      uid,
      sessionId,
      text,
      voiceId,
    } = req.body as {
      uid?: string;
      sessionId?: string;
      text?: string;
      voiceId?: string;
    };

    if (!uid || !sessionId || !text) {
      res.status(400).json({ error: 'uid, sessionId, and text are required' });
      return;
    }

    try {
      // sessionId is YYYY-MM-DD — used as both the Firestore key and Storage path segment
      const audioUrl = await generateAndUploadTTS({ uid, sessionDate: sessionId, text, voiceId });
      res.json({ audioUrl });
    } catch (err) {
      console.error('TTS generation failed:', err);
      res.status(500).json({ error: 'TTS generation failed' });
    }
  }
);
