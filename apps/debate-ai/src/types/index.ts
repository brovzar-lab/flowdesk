export type DebatePhase = 'setup' | 'debating' | 'paused' | 'concluding' | 'done';
export type Side = 'left' | 'right';
export type TurnStatus = 'streaming' | 'done';
export type Intensity = 1 | 2 | 3 | 4 | 5;

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
}

export interface DebateConfig {
  topic: string;
  leftDebater: Debater | null;
  rightDebater: Debater | null;
  intensity: Intensity;
}

export interface Turn {
  id: string;
  side: Side;
  text: string;
  status: TurnStatus;
}
