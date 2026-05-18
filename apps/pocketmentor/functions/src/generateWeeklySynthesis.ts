import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';

export interface FirestoreSynthesis {
  weekKey: string;
  weekLabel: string;
  themes: string[];
  progressSignals: string[];
  recommendedFocus: string;
  sessionCount: number;
  createdAt: admin.firestore.FieldValue | string;
}

export const generateWeeklySynthesis = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const uid = request.auth.uid;
    const weekKey = getISOWeekKey(new Date());
    const weekLabel = getISOWeekLabel(new Date());

    const db = admin.firestore();
    const synthRef = db.doc(`users/${uid}/synthesis/${weekKey}`);

    // Idempotency: return existing synthesis if already generated this week
    const existing = await synthRef.get();
    if (existing.exists) {
      return existing.data() as FirestoreSynthesis;
    }

    // Load sessions from the past 7 days with arcSummaryBullets
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

    const sessionsSnap = await db
      .collection(`users/${uid}/sessions`)
      .where('sessionDate', '>=', sevenDaysAgoStr)
      .orderBy('sessionDate', 'desc')
      .limit(7)
      .get();

    if (sessionsSnap.empty) {
      return null;
    }

    const sessions = sessionsSnap.docs.map((d) => d.data());

    const isMock =
      !process.env.ANTHROPIC_API_KEY ||
      process.env.ANTHROPIC_API_KEY === 'REPLACE_WITH_VALUE';

    if (isMock) {
      const synthDoc: FirestoreSynthesis = {
        weekKey,
        weekLabel,
        themes: ['Visibility', 'Systems thinking', 'Pattern recognition'],
        progressSignals: [
          'Consistently sharing planning process with manager',
          'Building habit of making private thinking public',
        ],
        recommendedFocus: 'Document your decision-making process — not just outcomes.',
        sessionCount: sessions.length,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await synthRef.set(synthDoc);
      return { ...synthDoc, createdAt: new Date().toISOString() };
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const sessionSummaries = sessions
      .map((s, i) => {
        const bullets =
          (s.arcSummaryBullets as string[] | undefined)?.join('\n  - ') ?? s.transcript ?? '';
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

    const synthDoc: FirestoreSynthesis = {
      weekKey,
      weekLabel,
      themes: parsed.themes ?? [],
      progressSignals: parsed.progressSignals ?? [],
      recommendedFocus: parsed.recommendedFocus ?? '',
      sessionCount: sessions.length,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await synthRef.set(synthDoc);
    return { ...synthDoc, createdAt: new Date().toISOString() };
  }
);

function getISOWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // ISO: Mon=1, Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Shift to Thursday of this ISO week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getISOWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1)); // Rewind to Monday
  return `Week of ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })}`;
}
