import { create } from 'zustand';
import type { AuthUser, Baby, BabyEvent } from './types';
import { DEMO_BABY, DEMO_EVENTS } from './mockData';
import { isDemoMode } from './demo';

type AppState = {
  user: AuthUser | null;
  baby: Baby | null;
  events: BabyEvent[];
  setUser: (user: AuthUser | null) => void;
  addEvent: (event: BabyEvent) => void;
};

export const useAppStore = create<AppState>((set) => ({
  user: isDemoMode
    ? { uid: 'demo', email: 'demo@parentcopilot.app', displayName: 'Demo Parent', isDemo: true }
    : null,
  baby: isDemoMode ? DEMO_BABY : null,
  events: isDemoMode ? DEMO_EVENTS : [],
  setUser: (user) => set({ user }),
  addEvent: (event) =>
    set((state) => ({ events: [event, ...state.events] })),
}));
