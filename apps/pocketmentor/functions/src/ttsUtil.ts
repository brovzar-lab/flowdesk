import * as admin from 'firebase-admin';
import OpenAI from 'openai';

const MOCK_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const TTS_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;
type TTSVoice = (typeof TTS_VOICES)[number];

export async function generateAndUploadTTS(opts: {
  uid: string;
  sessionDate: string; // YYYY-MM-DD — used as Storage path + Firestore session key
  text: string;
  voiceId?: string;
}): Promise<string> {
  const { uid, sessionDate, text, voiceId = 'onyx' } = opts;

  const isMock =
    !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'REPLACE_WITH_VALUE';

  const db = admin.firestore();
  const sessionRef = db.doc(`users/${uid}/sessions/${sessionDate}`);

  if (isMock) {
    await sessionRef.set({ audioUrl: MOCK_AUDIO_URL }, { merge: true });
    return MOCK_AUDIO_URL;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const voice: TTSVoice = TTS_VOICES.includes(voiceId as TTSVoice)
    ? (voiceId as TTSVoice)
    : 'onyx';

  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice,
    input: text,
  });
  const audioBuffer = Buffer.from(await mp3.arrayBuffer());

  const bucket = admin.storage().bucket();
  const filePath = `users/${uid}/sessions/${sessionDate}/coaching_audio.mp3`;
  const file = bucket.file(filePath);

  await file.save(audioBuffer, { metadata: { contentType: 'audio/mpeg' } });
  await file.makePublic();

  const audioUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
  await sessionRef.set({ audioUrl }, { merge: true });

  return audioUrl;
}
