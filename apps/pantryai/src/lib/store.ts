import { create } from 'zustand';
import type { DietaryPref } from './types';

interface PantryAIStore {
  uid: string | null;
  setUid: (uid: string | null) => void;
  dietaryPref: DietaryPref | null;
  setDietaryPref: (pref: DietaryPref) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (v: boolean) => void;
  isPremium: boolean;
  setIsPremium: (v: boolean) => void;
  scansThisMonth: number;
  setScansThisMonth: (n: number) => void;
  currentScanId: string | null;
  setCurrentScanId: (id: string | null) => void;
  currentPlanId: string | null;
  setCurrentPlanId: (id: string | null) => void;
  currentListId: string | null;
  setCurrentListId: (id: string | null) => void;
  isGeneratingPlan: boolean;
  setIsGeneratingPlan: (v: boolean) => void;
}

export const usePantryAIStore = create<PantryAIStore>((set) => ({
  uid: null,
  setUid: (uid) => set({ uid }),
  dietaryPref: null,
  setDietaryPref: (pref) => set({ dietaryPref: pref }),
  hasCompletedOnboarding: false,
  setHasCompletedOnboarding: (v) => set({ hasCompletedOnboarding: v }),
  isPremium: false,
  setIsPremium: (v) => set({ isPremium: v }),
  scansThisMonth: 0,
  setScansThisMonth: (n) => set({ scansThisMonth: n }),
  currentScanId: null,
  setCurrentScanId: (id) => set({ currentScanId: id }),
  currentPlanId: null,
  setCurrentPlanId: (id) => set({ currentPlanId: id }),
  currentListId: null,
  setCurrentListId: (id) => set({ currentListId: id }),
  isGeneratingPlan: false,
  setIsGeneratingPlan: (v) => set({ isGeneratingPlan: v }),
}));
