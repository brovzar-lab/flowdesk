export type DebatePhase = 'setup' | 'debating' | 'paused' | 'concluding' | 'done';
export type Side = 'left' | 'right';
export type TurnStatus = 'streaming' | 'done';
export type Intensity = 1 | 2 | 3 | 4 | 5;
export type DebateFormatId =
  | 'classic'
  | 'discussion'
  | 'dialectic'
  | 'heated'
  | 'socratic'
  | 'oxford';

export interface DebateFormat {
  id: DebateFormatId;
  label: string;
  emoji: string;
  blurb: string;
  framing: 'adversarial' | 'collaborative' | 'questioner';
  rhythmBias: 'short' | 'mixed' | 'long';
  endingType: 'verdict' | 'synthesis' | 'open';
}

export interface Voice {
  id: string;
  name: string;
  description: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  openrouterId: string;
  color: string;
}

export interface Debater {
  side: Side;
  model: Model;
  personaName: string;
  stance: string;
  voiceId: string;
}

export interface DebateConfig {
  topic: string;
  leftDebater: Debater | null;
  rightDebater: Debater | null;
  intensity: Intensity;
  format: DebateFormatId;
}

export interface Turn {
  id: string;
  side: Side;
  text: string;
  status: TurnStatus;
}
