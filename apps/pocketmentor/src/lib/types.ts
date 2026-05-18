export type CareerStage = 'starting_out' | 'in_the_grind' | 'making_a_move';
export type MentorId = 'alex_chen' | 'maya_okafor' | 'james_navarro';

export interface Mentor {
  id: MentorId;
  name: string;
  archetype: string;
  style: string;
  emoji: string;
  locked: boolean;
  lockReason?: string;
}

export interface Session {
  id: string;
  mentorId: MentorId;
  date: string;
  prompt: string;
  durationSeconds: number;
  arcResponse: string;
  isListened: boolean;
}

export interface ArcMessage {
  id: string;
  type: 'session' | 'response' | 'memo';
  date: string;
  content: string;
  mentorId?: MentorId;
}

export interface WeeklySynthesis {
  weekLabel: string;
  themes: string[];
  recommendedFocus: string;
  locked: boolean;
}
