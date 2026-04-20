import type { Baby, BabyEvent, FeedEvent, SleepEvent, DiaperEvent, Prediction, Tip } from './types';

export const DEMO_BABY: Baby = {
  id: 'demo-baby-1',
  name: 'Mia',
  birthDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days old
  weightKg: 4.8,
};

function daysAgo(days: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function buildFeedEvents(): FeedEvent[] {
  const events: FeedEvent[] = [];
  let id = 1;
  for (let day = 14; day >= 0; day--) {
    const feedHours = [2, 5, 8, 11, 14, 17, 20, 23];
    for (const hour of feedHours) {
      events.push({
        id: `feed-${id++}`,
        babyId: DEMO_BABY.id,
        type: 'feed',
        timestamp: daysAgo(day, hour, Math.floor(Math.random() * 15)),
        method: hour < 6 || hour > 20 ? 'breast' : 'bottle',
        durationMinutes: hour < 6 ? 20 + Math.floor(Math.random() * 10) : undefined,
        amountOz: hour >= 6 && hour <= 20 ? 3 + Math.floor(Math.random() * 2) : undefined,
      });
    }
  }
  return events;
}

function buildSleepEvents(): SleepEvent[] {
  const events: SleepEvent[] = [];
  let id = 1;
  for (let day = 14; day >= 0; day--) {
    const naps = [
      { start: 9, durationH: 1.5 },
      { start: 13, durationH: 2 },
      { start: 17, durationH: 0.75 },
    ];
    for (const nap of naps) {
      const start = daysAgo(day, nap.start, 0);
      const end = new Date(start.getTime() + nap.durationH * 60 * 60 * 1000);
      events.push({
        id: `sleep-${id++}`,
        babyId: DEMO_BABY.id,
        type: 'sleep',
        timestamp: start,
        startTime: start,
        endTime: end,
        quality: nap.durationH >= 1.5 ? 'good' : 'fair',
      });
    }
    // Night sleep
    const nightStart = daysAgo(day, 21, 0);
    const nightEnd = new Date(nightStart.getTime() + 7.5 * 60 * 60 * 1000);
    events.push({
      id: `sleep-night-${id++}`,
      babyId: DEMO_BABY.id,
      type: 'sleep',
      timestamp: nightStart,
      startTime: nightStart,
      endTime: nightEnd,
      quality: 'good',
    });
  }
  return events;
}

function buildDiaperEvents(): DiaperEvent[] {
  const events: DiaperEvent[] = [];
  let id = 1;
  for (let day = 14; day >= 0; day--) {
    const diaperHours = [4, 7, 10, 13, 16, 19, 22];
    for (const hour of diaperHours) {
      events.push({
        id: `diaper-${id++}`,
        babyId: DEMO_BABY.id,
        type: 'diaper',
        timestamp: daysAgo(day, hour),
        diaperType: hour % 3 === 0 ? 'dirty' : hour % 3 === 1 ? 'wet' : 'both',
      });
    }
  }
  return events;
}

export const DEMO_EVENTS: BabyEvent[] = [
  ...buildFeedEvents(),
  ...buildSleepEvents(),
  ...buildDiaperEvents(),
].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

export const DEMO_PREDICTIONS: Prediction[] = [
  {
    id: 'pred-1',
    label: 'Next feed',
    description: 'Mia typically feeds every ~3 hours. Next feed expected around 2:45 PM.',
    confidence: 0.87,
    estimatedTime: (() => {
      const t = new Date();
      t.setHours(14, 45, 0, 0);
      return t;
    })(),
  },
  {
    id: 'pred-2',
    label: 'Afternoon nap window',
    description: 'Based on the last 7 days, Mia usually naps 13:00–15:00. Put her down by 1 PM.',
    confidence: 0.82,
    estimatedTime: (() => {
      const t = new Date();
      t.setHours(13, 0, 0, 0);
      return t;
    })(),
  },
  {
    id: 'pred-3',
    label: 'Fussy window',
    description: 'Evening fussiness pattern detected 17:30–19:00. Consider cluster feeding.',
    confidence: 0.74,
    estimatedTime: (() => {
      const t = new Date();
      t.setHours(17, 30, 0, 0);
      return t;
    })(),
  },
];

export const DEMO_TIPS: Tip[] = [
  {
    id: 'tip-1',
    text: 'Mia's night sleep stretches are improving — averaging 7.5 hrs. Keep the bedtime routine consistent.',
    category: 'sleep',
  },
  {
    id: 'tip-2',
    text: 'Bottle feeds are averaging 3.5 oz. If she seems unsatisfied, try bumping to 4 oz for the afternoon feeds.',
    category: 'feeding',
  },
  {
    id: 'tip-3',
    text: 'At 60 days, tummy time for 3-5 min after each wake window helps build neck strength.',
    category: 'development',
  },
];
