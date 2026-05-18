import { create } from 'zustand';
import type { Task, ScheduleBlock } from './types';
import { isDemoMode, COCKPIT_DURATION_SEC, FREE_TASK_LIMIT } from './config';
import { DEMO_TASKS, DEMO_SCHEDULE } from '../demo/seed';

interface FlowDeskState {
  tasks: Task[];
  schedule: ScheduleBlock[];
  activeTaskId: string | null;
  cockpitSecondsLeft: number;
  cockpitRunning: boolean;
  paywallOpen: boolean;
  isAuthenticated: boolean;

  signInDemo: () => void;
  signOut: () => void;
  addTask: (task: Omit<Task, 'id' | 'done'>) => void;
  removeTask: (id: string) => void;
  toggleTask: (id: string) => void;
  enterCockpit: (taskId: string) => void;
  exitCockpit: () => void;
  tickTimer: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  openPaywall: () => void;
  closePaywall: () => void;
}

export const useStore = create<FlowDeskState>((set, get) => ({
  tasks: isDemoMode ? DEMO_TASKS : [],
  schedule: isDemoMode ? DEMO_SCHEDULE : [],
  activeTaskId: null,
  cockpitSecondsLeft: COCKPIT_DURATION_SEC,
  cockpitRunning: false,
  paywallOpen: false,
  isAuthenticated: isDemoMode,

  signInDemo: () => set({ isAuthenticated: true }),
  signOut: () =>
    set({
      isAuthenticated: isDemoMode,
      tasks: isDemoMode ? DEMO_TASKS : [],
      schedule: isDemoMode ? DEMO_SCHEDULE : [],
    }),

  addTask: (task) => {
    const { tasks } = get();
    if (tasks.length >= FREE_TASK_LIMIT) {
      set({ paywallOpen: true });
      return;
    }
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      done: false,
    };
    set({ tasks: [...tasks, newTask] });
  },

  removeTask: (id) =>
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      schedule: s.schedule.filter((b) => b.taskId !== id),
    })),

  toggleTask: (id) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    })),

  enterCockpit: (taskId) =>
    set({ activeTaskId: taskId, cockpitSecondsLeft: COCKPIT_DURATION_SEC, cockpitRunning: false }),

  exitCockpit: () =>
    set({ activeTaskId: null, cockpitRunning: false, cockpitSecondsLeft: COCKPIT_DURATION_SEC }),

  tickTimer: () => {
    const { cockpitSecondsLeft, cockpitRunning } = get();
    if (!cockpitRunning) return;
    if (cockpitSecondsLeft <= 0) {
      set({ cockpitRunning: false });
      return;
    }
    set({ cockpitSecondsLeft: cockpitSecondsLeft - 1 });
  },

  startTimer: () => set({ cockpitRunning: true }),
  pauseTimer: () => set({ cockpitRunning: false }),

  openPaywall: () => set({ paywallOpen: true }),
  closePaywall: () => set({ paywallOpen: false }),
}));
