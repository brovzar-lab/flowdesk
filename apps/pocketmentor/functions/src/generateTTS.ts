import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

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
      voiceId = 'onyx',
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

    const db = admin.firestore();
    const sessionRef = db.doc(`users/${uid}/sessions/${sessionId}`);

    if (isMockMode) {
      // In mock mode return a silent placeholder audio URL
      const mockAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      await sessionRef.set({ audioUrl: mockAudioUrl }, { merge: true });
      res.json({ audioUrl: mockAudioUrl });
      return;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // OpenAI TTS voices: alloy, echo, fable, onyx, nova, shimmer
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const voice = validVoices.includes(voiceId) ? voiceId : 'onyx';

    let audioBuffer: Buffer;
    try {
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
        input: text,
      });
      audioBuffer = Buffer.from(await mp3.arrayBuffer());
    } catch (err) {
      console.error('TTS generation failed:', err);
      res.status(500).json({ error: 'TTS generation failed' });
      return;
    }

    const bucket = admin.storage().bucket();
    const filePath = `users/${uid}/sessions/${sessionId}/coaching_audio.mp3`;
    const file = bucket.file(filePath);

    await file.save(audioBuffer, {
      metadata: { contentType: 'audio/mpeg' },
    });

    await file.makePublic();
    const audioUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    await sessionRef.set({ audioUrl }, { merge: true });

    res.json({ audioUrl });
  }
);
