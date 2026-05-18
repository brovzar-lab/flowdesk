import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';
import { getMentorPersona } from './mentorPersonas';
import { generateAndUploadTTS } from './ttsUtil';

type MentorId = 'alex_chen' | 'maya_okafor' | 'james_navarro';
type CareerStage = 'early' | 'mid' | 'senior' | 'lead' | 'executive';

const MOCK_PROMPT =
  "What's one decision you've been putting off this week, and what's really behind the hesitation?";
const MOCK_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

export const generateDailySession = onCall(
  { secrets: ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'], timeoutSeconds: 120, memory: '512MiB' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const uid = request.auth.uid;
    const { mentorId = 'alex_chen', careerStage = 'mid' } = (request.data ?? {}) as {
      mentorId?: MentorId;
      careerStage?: CareerStage;
    };

    const sessionDate = new Date().toISOString().slice(0, 10);
    const db = admin.firestore();
    const sessionRef = db.doc(`users/${uid}/sessions/${sessionDate}`);

    // Idempotency: return existing session if already generated today
    const existing = await sessionRef.get();
    if (existing.exists && existing.data()?.audioUrl) {
      return existing.data();
    }

    const isMock =
      !process.env.ANTHROPIC_API_KEY ||
      process.env.ANTHROPIC_API_KEY === 'REPLACE_WITH_VALUE' ||
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === 'REPLACE_WITH_VALUE';

    if (isMock) {
      const sessionDoc = {
        mentorId,
        sessionDate,
        prompt: MOCK_PROMPT,
        audioUrl: MOCK_AUDIO_URL,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await sessionRef.set(sessionDoc, { merge: true });
      return { ...sessionDoc, createdAt: new Date().toISOString() };
    }

    // Load last 7 sessions with arcSummaryBullets for RAG context
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

    const recentSnap = await db
      .collection(`users/${uid}/sessions`)
      .where('sessionDate', '>=', sevenDaysAgoStr)
      .where('sessionDate', '<', sessionDate)
      .orderBy('sessionDate', 'desc')
      .limit(7)
      .get();

    const arcContext = recentSnap.docs
      .filter((d) => d.data().arcSummaryBullets)
      .map((d) => {
        const data = d.data();
        const bullets = (data.arcSummaryBullets as string[]).join('\n  - ');
        return `${data.sessionDate}:\n  - ${bullets}`;
      })
      .join('\n\n');

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const persona = getMentorPersona(mentorId);

    const userContent = [
      arcContext ? `Recent coaching arc (last 7 sessions):\n${arcContext}\n\n` : '',
      `Career stage: ${careerStage}\n\n`,
      'Generate one powerful 1-2 sentence coaching question for today\'s reflection. Be specific to this person\'s arc and stage. Return only the question, nothing else.',
    ].join('');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      // cache_control is valid at runtime but not typed in @anthropic-ai/sdk@0.32.x
      system: [
        { type: 'text', text: persona.systemPrompt, cache_control: { type: 'ephemeral' } },
      ] as any,
      messages: [{ role: 'user', content: userContent }],
    });

    const prompt =
      message.content[0].type === 'text'
        ? message.content[0].text.trim()
        : MOCK_PROMPT;

    // Write session doc before TTS so a partial session exists if TTS fails
    await sessionRef.set(
      { mentorId, sessionDate, prompt, createdAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    const audioUrl = await generateAndUploadTTS({ uid, sessionDate, text: prompt });

    const finalDoc = { mentorId, sessionDate, prompt, audioUrl };
    return finalDoc;
  }
);
