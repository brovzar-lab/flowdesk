import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';
import { getMentorPersona } from './mentorPersonas';

const isMockMode =
  !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'REPLACE_WITH_VALUE';

const MOCK_RESPONSE = `Good question to sit with. Here's my take — the answer is usually the thing you've been "saving" for the right moment.

You keep waiting for the big project, the perfect opportunity. But your manager is forming their picture of you right now, from small signals.

Your task: Name one thing you've been holding back. Then figure out the smallest possible version you could show this week. Not perfect. Just visible.`;

const MOCK_ARC_DIRECTION =
  'User is working on visibility and making their thought process legible to their manager. Key theme: from private planning to public impact.';

// Firestore trigger: fires when a session document gets a `transcript` field
export const generateCoachingResponse = onDocumentUpdated(
  {
    document: 'users/{uid}/sessions/{sessionId}',
    ...(isMockMode ? {} : { secrets: ['ANTHROPIC_API_KEY'] }),
  },
  async (event) => {
    const before = event.data?.before.data() ?? {};
    const after = event.data?.after.data() ?? {};

    // Only run when transcript is newly populated
    if (!after.transcript || before.transcript === after.transcript) return;
    // Skip if coaching response already exists
    if (after.coachingResponse) return;

    const { uid, sessionId } = event.params;
    const { mentorId = 'alex_chen', sessionDate, prompt: dailyPrompt } = after;

    const db = admin.firestore();
    const sessionRef = db.doc(`users/${uid}/sessions/${sessionId}`);

    if (isMockMode) {
      await sessionRef.set(
        {
          coachingResponse: MOCK_RESPONSE,
          arcDirection: MOCK_ARC_DIRECTION,
          arcSummaryBullets: [
            'User is working on making their thought process visible to their manager',
            'Small, consistent signals matter more than big moments',
            'User is moving from private planning to public impact',
          ],
          coachingGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return;
    }

    // Load last 7 arc summaries for RAG context
    const arcSnap = await db
      .collection(`users/${uid}/sessions`)
      .orderBy('sessionDate', 'desc')
      .limit(8)
      .get();

    const arcContext = arcSnap.docs
      .filter((d) => d.id !== sessionId && d.data().arcSummaryBullets)
      .slice(0, 7)
      .map((d) => {
        const data = d.data();
        const bullets = (data.arcSummaryBullets as string[]).join('\n  - ');
        return `Session ${data.sessionDate}:\n  - ${bullets}`;
      })
      .join('\n\n');

    const persona = getMentorPersona(mentorId);

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const userContent = [
      arcContext
        ? `## Coaching Arc History (last 7 sessions)\n${arcContext}\n\n---\n\n`
        : '',
      dailyPrompt ? `## Today's question I asked: "${dailyPrompt}"\n\n` : '',
      `## User's voice memo (transcript):\n${after.transcript}`,
    ].join('');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      // cache_control is valid at runtime but not typed in @anthropic-ai/sdk@0.32.x
      system: [
        { type: 'text', text: persona.systemPrompt, cache_control: { type: 'ephemeral' } },
      ] as any,
      messages: [{ role: 'user', content: userContent }],
    });

    const coachingResponse =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Generate arc summary bullets for RAG in future sessions
    const summaryMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: 'You summarise coaching sessions into exactly 3 bullet points. Be specific, not generic. Focus on what the user is working on and how they are progressing.',
      messages: [
        {
          role: 'user',
          content: `Session transcript: ${after.transcript}\n\nCoaching response: ${coachingResponse}\n\nSummarise this session in exactly 3 bullet points.`,
        },
      ],
    });

    const summaryText =
      summaryMessage.content[0].type === 'text' ? summaryMessage.content[0].text : '';
    const arcSummaryBullets = summaryText
      .split('\n')
      .map((l) => l.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 3);

    const arcDirection =
      arcSummaryBullets[0] ?? 'Continuing to develop career visibility and impact.';

    await sessionRef.set(
      {
        coachingResponse,
        arcDirection,
        arcSummaryBullets,
        coachingGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        sessionDate: sessionDate ?? new Date().toISOString().slice(0, 10),
      },
      { merge: true }
    );
  }
);
