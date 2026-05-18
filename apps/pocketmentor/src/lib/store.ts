import { create } from 'zustand';
import type { CareerStage, MentorId } from './types';

interface PocketMentorStore {
  careerStage: CareerStage | null;
  setCareerStage: (stage: CareerStage) => void;
  activeMentorId: MentorId;
  setActiveMentorId: (id: MentorId) => void;
  isPremium: boolean;
  setIsPremium: (v: boolean) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (v: boolean) => void;
  paywallVisible: boolean;
  setPaywallVisible: (v: boolean) => void;
  notificationTime: string;
  setNotificationTime: (time: string) => void;
}

export const usePocketMentorStore = create<PocketMentorStore>((set) => ({
  careerStage: null,
  setCareerStage: (stage) => set({ careerStage: stage }),
  activeMentorId: 'alex_chen',
  setActiveMentorId: (id) => set({ activeMentorId: id }),
  isPremium: false,
  setIsPremium: (v) => set({ isPremium: v }),
  hasCompletedOnboarding: false,
  setHasCompletedOnboarding: (v) => set({ hasCompletedOnboarding: v }),
  paywallVisible: false,
  setPaywallVisible: (v) => set({ paywallVisible: v }),
  notificationTime: '08:00',
  setNotificationTime: (time) => set({ notificationTime: time }),
}));
