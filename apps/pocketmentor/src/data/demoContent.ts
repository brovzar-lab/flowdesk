import type { Mentor, Session, ArcMessage, WeeklySynthesis } from '../lib/types';
import type { CareerStage } from '../lib/types';

export const DEMO_MENTORS: Mentor[] = [
  {
    id: 'alex_chen',
    name: 'Alex Chen',
    archetype: 'The Pragmatic Builder',
    style: 'Direct, warm, assigns one thing per day',
    emoji: '🏗️',
    locked: false,
  },
  {
    id: 'maya_okafor',
    name: 'Maya Okafor',
    archetype: 'The Human-First Strategist',
    style: 'Warm, starts with feelings, ends with a reframe',
    emoji: '🌱',
    locked: false,
  },
  {
    id: 'james_navarro',
    name: 'James Navarro',
    archetype: 'The Creative Disruptor',
    style: 'Unconventional, challenges assumptions, reframes constraints',
    emoji: '⚡',
    locked: true,
    lockReason: 'Unlock after a 30-day streak',
  },
];

export const DEMO_SESSION: Session = {
  id: 'session-001',
  mentorId: 'alex_chen',
  date: '2026-05-18',
  prompt: "What's one thing your manager hasn't seen from you yet?",
  durationSeconds: 180,
  arcResponse:
    "Good question to sit with. Here's my take — the answer is usually the thing you've been \"saving\" for the right moment.\n\nYou keep waiting for the big project, the perfect opportunity. But your manager is forming their picture of you right now, from small signals.\n\nYour task today: name one thing. Then figure out the smallest possible version you could show this week.\n\nNot perfect. Just visible.",
  isListened: false,
};

export const DEMO_ARC_MESSAGES: ArcMessage[] = [
  {
    id: 'arc-001',
    type: 'session',
    date: 'May 11',
    content: 'Your first session with Alex. The question that started it all.',
    mentorId: 'alex_chen',
  },
  {
    id: 'arc-002',
    type: 'response',
    date: 'May 11',
    content:
      "I've been thinking about this. The thing my manager hasn't seen is how I break down problems before I start building. Maybe it's time to make that visible.",
  },
  {
    id: 'arc-003',
    type: 'session',
    date: 'May 12',
    content: 'How did it land? Did you share it?',
    mentorId: 'alex_chen',
  },
  {
    id: 'arc-004',
    type: 'response',
    date: 'May 12',
    content:
      "I shared my planning doc. My manager said 'this is exactly what I needed to see.' Small thing, big shift.",
  },
  {
    id: 'arc-005',
    type: 'session',
    date: 'May 13',
    content: "That's a data point. Now we build the pattern.",
    mentorId: 'alex_chen',
  },
  {
    id: 'arc-006',
    type: 'response',
    date: 'May 13',
    content: "Starting to see it. Visibility isn't bragging — it's information.",
  },
  {
    id: 'arc-007',
    type: 'session',
    date: 'May 14',
    content: 'What would a promotion case for you look like, right now?',
    mentorId: 'alex_chen',
  },
  {
    id: 'arc-008',
    type: 'response',
    date: 'May 14',
    content:
      "Honestly? Messy. I'd need to document the last 6 months differently. That's this week's task.",
  },
  {
    id: 'arc-009',
    type: 'session',
    date: 'May 18',
    content: "Today's question: What's one thing your manager hasn't seen from you yet?",
    mentorId: 'alex_chen',
  },
];

export const DEMO_WEEKLY_SYNTHESIS: WeeklySynthesis = {
  weekLabel: 'Week of May 11',
  themes: ['Visibility', 'Systems thinking', 'Pattern recognition'],
  recommendedFocus: 'Document your decision-making process — not just outcomes.',
  locked: false,
};

export const DEMO_WEEKLY_SYNTHESIS_LOCKED: WeeklySynthesis = {
  weekLabel: 'Week of May 18',
  themes: ['???', '???', '???'],
  recommendedFocus: 'Unlock to see your Week 2 focus.',
  locked: true,
};

export const DEMO_VOICE_MEMO_TRANSCRIPTION =
  "I've been thinking about this a lot. The thing my manager hasn't seen is how I break down problems before I start building. I have all these planning notes that just live in private. Maybe it's time to make that visible.";

export const CAREER_STAGE_LABELS: Record<CareerStage, string> = {
  starting_out: 'Starting Out',
  in_the_grind: 'In the Grind',
  making_a_move: 'Making a Move',
};

export const CAREER_STAGE_DESCRIPTIONS: Record<CareerStage, string> = {
  starting_out: 'New role, new team, building credibility',
  in_the_grind: 'Proven but plateaued, need the next thing',
  making_a_move: 'Ready to pivot, promote, or leave',
};
