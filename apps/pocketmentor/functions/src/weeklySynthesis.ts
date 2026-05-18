import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';

const isMockMode =
  !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'REPLACE_WITH_VALUE';

// Runs Sunday at 8am UTC (schedule adjusted — users should receive at their local 8am via notification)
export const weeklySynthesis = onSchedule(
  {
    schedule: '0 8 * * 0',
    timeZone: 'UTC',
    ...(isMockMode ? {} : { secrets: ['ANTHROPIC_API_KEY'] }),
  },
  async () => {
    const db = admin.firestore();
    const usersSnap = await db.collection('users').get();

    const weekId = getWeekId(new Date());

    await Promise.allSettled(
      usersSnap.docs.map((userDoc) => processUserSynthesis(db, userDoc.id, weekId))
    );
  }
);

async function processUserSynthesis(
  db: admin.firestore.Firestore,
  uid: string,
  weekId: string
): Promise<void> {
  // Skip if synthesis already exists for this week
  const existingRef = db.doc(`users/${uid}/syntheses/${weekId}`);
  const existing = await existingRef.get();
  if (existing.exists) return;

  // Get last 7 sessions
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  const sessionsSnap = await db
    .collection(`users/${uid}/sessions`)
    .where('sessionDate', '>=', sevenDaysAgoStr)
    .orderBy('sessionDate', 'desc')
    .limit(7)
    .get();

  if (sessionsSnap.empty) return;

  const sessions = sessionsSnap.docs.map((d) => d.data());

  if (isMockMode) {
    await existingRef.set({
      weekId,
      weekLabel: getWeekLabel(new Date()),
      themes: ['Visibility', 'Systems thinking', 'Pattern recognition'],
      progressSignals: [
        'Consistently sharing planning process with manager',
        'Building habit of making private thinking public',
      ],
      recommendedFocus: 'Document your decision-making process — not just outcomes.',
      sessionCount: sessions.length,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return;
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const sessionSummaries = sessions
    .map((s, i) => {
      const bullets = (s.arcSummaryBullets as string[] | undefined)?.join('\n  - ') ?? s.transcript ?? '';
      return `Session ${i + 1} (${s.sessionDate}):\n  - ${bullets}`;
    })
    .join('\n\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: `You synthesise a week of career coaching sessions into a structured summary. Be specific and insight-driven, not generic. Focus on genuine patterns and progress signals.

Return your response as JSON with this exact shape:
{
  "themes": ["theme1", "theme2", "theme3"],
  "progressSignals": ["signal1", "signal2"],
  "recommendedFocus": "One specific, actionable focus area for the coming week"
}`,
    messages: [
      {
        role: 'user',
        content: `Here are the last ${sessions.length} coaching sessions for this user:\n\n${sessionSummaries}\n\nSynthesise these into the weekly summary JSON.`,
      },
    ],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '{}';

  let parsed: {
    themes?: string[];
    progressSignals?: string[];
    recommendedFocus?: string;
  } = {};
  try {
    parsed = JSON.parse(responseText.replace(/```json\n?|\n?```/g, ''));
  } catch {
    console.error('Failed to parse weekly synthesis JSON for uid:', uid, responseText);
  }

  await existingRef.set({
    weekId,
    weekLabel: getWeekLabel(new Date()),
    themes: parsed.themes ?? [],
    progressSignals: parsed.progressSignals ?? [],
    recommendedFocus: parsed.recommendedFocus ?? '',
    sessionCount: sessions.length,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

function getWeekId(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // rewind to Sunday
  return d.toISOString().slice(0, 10);
}

function getWeekLabel(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return `Week of ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
}
