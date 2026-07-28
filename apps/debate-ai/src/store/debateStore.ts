import { create } from 'zustand';
import type {
  DebatePhase,
  DebateFormatId,
  Intensity,
  Side,
  Turn,
  DebateConfig,
  Debater,
  Model,
} from '../types';
import { getOpenRouterKey } from '../lib/config';
import { DEMO_TOPIC } from '../data/models';
import { DEFAULT_VOICE_ID } from '../data/voices';

interface DebateState {
  phase: DebatePhase;
  config: DebateConfig;
  turns: Turn[];
  intensity: Intensity;
}

interface DebateActions {
  setTopic: (topic: string) => void;
  setFormat: (format: DebateFormatId) => void;
  assignDebater: (side: Side, model: Model) => void;
  removeDebater: (side: Side) => void;
  setPersonaName: (side: Side, name: string) => void;
  setStance: (side: Side, stance: string) => void;
  setVoiceId: (side: Side, voiceId: string) => void;
  setIntensity: (level: Intensity) => void;
  startDebate: () => void;
  pauseDebate: () => void;
  resumeDebate: () => void;
  concludeDebate: () => void;
  addTurn: (turn: Omit<Turn, 'id'>) => void;
  updateLastTurn: (text: string, status: Turn['status']) => void;
  reset: () => void;
}

function makeInitialConfig(): DebateConfig {
  const isDemo = !getOpenRouterKey();
  return {
    topic: isDemo ? DEMO_TOPIC : '',
    leftDebater: null,
    rightDebater: null,
    intensity: 3,
    format: 'classic',
  };
}

function buildDebater(side: Side, model: Model): Debater {
  return { side, model, personaName: '', stance: '', voiceId: DEFAULT_VOICE_ID };
}

function makeInitialState(): DebateState {
  return {
    phase: 'setup',
    config: makeInitialConfig(),
    turns: [],
    intensity: 3,
  };
}

export const useDebateStore = create<DebateState & DebateActions>((set, get) => ({
  ...makeInitialState(),

  setTopic: (topic) => set((s) => ({ config: { ...s.config, topic } })),

  setFormat: (format) => set((s) => ({ config: { ...s.config, format } })),

  assignDebater: (side, model) =>
    set((s) => {
      const existing = side === 'left' ? s.config.leftDebater : s.config.rightDebater;
      const debater: Debater = existing ? { ...existing, model } : buildDebater(side, model);
      return {
        config: {
          ...s.config,
          leftDebater: side === 'left' ? debater : s.config.leftDebater,
          rightDebater: side === 'right' ? debater : s.config.rightDebater,
        },
      };
    }),

  removeDebater: (side) =>
    set((s) => ({
      config: {
        ...s.config,
        leftDebater: side === 'left' ? null : s.config.leftDebater,
        rightDebater: side === 'right' ? null : s.config.rightDebater,
      },
    })),

  setPersonaName: (side, personaName) =>
    set((s) => {
      const debater = side === 'left' ? s.config.leftDebater : s.config.rightDebater;
      if (!debater) return s;
      const updated = { ...debater, personaName };
      return {
        config: {
          ...s.config,
          leftDebater: side === 'left' ? updated : s.config.leftDebater,
          rightDebater: side === 'right' ? updated : s.config.rightDebater,
        },
      };
    }),

  setStance: (side, stance) =>
    set((s) => {
      const debater = side === 'left' ? s.config.leftDebater : s.config.rightDebater;
      if (!debater) return s;
      const updated = { ...debater, stance };
      return {
        config: {
          ...s.config,
          leftDebater: side === 'left' ? updated : s.config.leftDebater,
          rightDebater: side === 'right' ? updated : s.config.rightDebater,
        },
      };
    }),

  setVoiceId: (side, voiceId) =>
    set((s) => {
      const debater = side === 'left' ? s.config.leftDebater : s.config.rightDebater;
      if (!debater) return s;
      const updated = { ...debater, voiceId };
      return {
        config: {
          ...s.config,
          leftDebater: side === 'left' ? updated : s.config.leftDebater,
          rightDebater: side === 'right' ? updated : s.config.rightDebater,
        },
      };
    }),

  setIntensity: (level) =>
    set((s) => ({ intensity: level, config: { ...s.config, intensity: level } })),

  startDebate: () => {
    const { phase, config } = get();
    if (phase !== 'setup') return;
    if (!config.topic.trim() || !config.leftDebater || !config.rightDebater) return;
    set({ phase: 'debating' });
  },

  pauseDebate: () => {
    if (get().phase !== 'debating') return;
    set({ phase: 'paused' });
  },

  resumeDebate: () => {
    if (get().phase !== 'paused') return;
    set({ phase: 'debating' });
  },

  concludeDebate: () => {
    const phase = get().phase;
    if (phase !== 'debating' && phase !== 'paused') return;
    set({ phase: 'concluding' });
  },

  addTurn: (turn) =>
    set((s) => ({
      turns: [...s.turns, { ...turn, id: `turn-${s.turns.length + 1}` }],
    })),

  updateLastTurn: (text, status) =>
    set((s) => {
      if (s.turns.length === 0) return s;
      const turns = [...s.turns];
      turns[turns.length - 1] = { ...turns[turns.length - 1], text, status };
      return { turns };
    }),

  reset: () => set(makeInitialState()),
}));
