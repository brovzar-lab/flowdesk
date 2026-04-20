import { onCall, HttpsError } from 'firebase-functions/v2/https';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

type BabySummary = {
  babyAgedays: number;
  recentFeeds: number;
  recentSleepHours: number;
  recentDiapers: number;
};

export const getTips = onCall<BabySummary>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in');
  }

  const { babyAgedays, recentFeeds, recentSleepHours, recentDiapers } = request.data;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system:
      'You are a friendly pediatric coach for new parents. Respond with 2-3 concise, practical tips based on the baby tracking data provided. Each tip should be 1-2 sentences. Return plain text, no markdown.',
    messages: [
      {
        role: 'user',
        content: `Baby age: ${babyAgedays} days. Last 24h: ${recentFeeds} feeds, ${recentSleepHours} hours sleep, ${recentDiapers} diapers. What are 2-3 practical tips?`,
      },
    ],
  });

  const text =
    message.content[0].type === 'text' ? message.content[0].text : '';
  return { tips: text.split('\n').filter(Boolean) };
});
