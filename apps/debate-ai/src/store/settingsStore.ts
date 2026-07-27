import { create } from 'zustand';
import { getOpenRouterKey, persistOpenRouterKey } from '../lib/config';

interface SettingsState {
  openRouterKey: string | null;
  isDemoMode: boolean;
  setOpenRouterKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  openRouterKey: getOpenRouterKey(),
  isDemoMode: !getOpenRouterKey(),

  setOpenRouterKey: (key: string) => {
    persistOpenRouterKey(key);
    const stored = key.trim() || null;
    set({ openRouterKey: stored, isDemoMode: !stored });
  },
}));
