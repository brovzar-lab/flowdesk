import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

export type BabySummary = {
  babyAgedays: number;
  recentFeeds: number;
  recentSleepHours: number;
  recentDiapers: number;
};

export async function fetchLiveTips(summary: BabySummary): Promise<string[]> {
  const functions = getFunctions(app!);
  const getTips = httpsCallable<BabySummary, { tips: string[] }>(functions, 'getTips');
  const result = await getTips(summary);
  return result.data.tips;
}
