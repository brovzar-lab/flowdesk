export type EventType = 'feed' | 'sleep' | 'diaper';

export type FeedMethod = 'breast' | 'bottle' | 'solid';
export type DiaperType = 'wet' | 'dirty' | 'both';
export type SleepQuality = 'good' | 'fair' | 'poor';

export type BabyEvent =
  | FeedEvent
  | SleepEvent
  | DiaperEvent;

export type BaseEvent = {
  id: string;
  babyId: string;
  timestamp: Date;
  notes?: string;
};

export type FeedEvent = BaseEvent & {
  type: 'feed';
  method: FeedMethod;
  durationMinutes?: number;
  amountOz?: number;
};

export type SleepEvent = BaseEvent & {
  type: 'sleep';
  startTime: Date;
  endTime?: Date;
  quality?: SleepQuality;
};

export type DiaperEvent = BaseEvent & {
  type: 'diaper';
  diaperType: DiaperType;
};

export type Prediction = {
  id: string;
  label: string;
  description: string;
  confidence: number;
  estimatedTime?: Date;
};

export type Tip = {
  id: string;
  text: string;
  category: 'feeding' | 'sleep' | 'development' | 'wellbeing';
};

export type Baby = {
  id: string;
  name: string;
  birthDate: Date;
  weightKg?: number;
};

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  isDemo: boolean;
};
