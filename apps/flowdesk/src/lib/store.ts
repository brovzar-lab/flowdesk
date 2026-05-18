import { create } from 'zustand';
import type { Task, ScheduleBlock } from './types';
import { isDemoMode, COCKPIT_DURATION_SEC, FREE_TASK_LIMIT } from './config';
import { DEMO_TASKS, DEMO_SCHEDULE, DEMO_EFFICIENCY_SCORE } from '../demo/seed';
import { buildSchedule, calculateEfficiencyScore } from './schedulingEngine';
import type { EngineTask, TimeRange } from './schedulingEngine';
import { DEMO_CALENDAR_GAPS } from './googleCalendar';
import { writeSessionToExtension, clearSessionFromExtension } from './chromeBridge';
import { useAuthStore } from './auth';
import {
  addTaskToFirestore,
  deleteTaskFromFirestore,
  updateTaskInFirestore,
  saveSessionToFirestore,
  saveScheduleToFirestore,
} from './firestore';
import type { SessionData } from './firestore';

function toEngineTask(t: Task): EngineTask {
  return {
    id: t.id,
    title: t.title,
    durationMin: t.durationMin >= 50 ? 50 : 25,
    cognitiveLoad: t.type,
    status: t.done ? 'done' : 'pending',
  };
}

function focusBlockToScheduleBlock(
  b: ReturnType<typeof buildSchedule>[number],
  idx: number,
): ScheduleBlock {
  const startH = b.start.getHours();
  const startM = b.start.getMinutes();
  const durationMin = (b.end.getTime() - b.start.getTime()) / 60000;
  return {
    id: `block-${b.task.id}-${idx}`,
    taskId: b.task.id,
    title: b.task.title,
    type: b.type,
    startHour: startH,
    startMin: startM,
    durationMin,
  };
}

interface CockpitSession {
  taskId: string;
  taskTitle: string;
  startedAt: Date;
}

interface FlowDeskState {
  tasks: Task[];
  schedule: ScheduleBlock[];
  efficiencyScore: number;
  activeTaskId: string | null;
  cockpitSecondsLeft: number;
  cockpitRunning: boolean;
  paywallOpen: boolean;
  isAuthenticated: boolean;
  cockpitSession: CockpitSession | null;

  signInDemo: () => void;
  signOut: () => void;
  addTask: (task: Omit<Task, 'id' | 'done'>) => void;
  removeTask: (id: string) => void;
  toggleTask: (id: string) => void;
  enterCockpit: (taskId: string) => void;
  exitCockpit: (completed?: boolean) => void;
  tickTimer: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  openPaywall: () => void;
  closePaywall: () => void;
  runScheduler: (gaps?: TimeRange[]) => void;
}

export const useStore = create<FlowDeskState>((set, get) => ({
  tasks: isDemoMode ? DEMO_TASKS : [],
  schedule: isDemoMode ? DEMO_SCHEDULE : [],
  efficiencyScore: isDemoMode ? DEMO_EFFICIENCY_SCORE : 0,
  activeTaskId: null,
  cockpitSecondsLeft: COCKPIT_DURATION_SEC,
  cockpitRunning: false,
  paywallOpen: false,
  isAuthenticated: isDemoMode,
  cockpitSession: null,

  signInDemo: () => set({ isAuthenticated: true }),
  signOut: () =>
    set({
      isAuthenticated: isDemoMode,
      tasks: isDemoMode ? DEMO_TASKS : [],
      schedule: isDemoMode ? DEMO_SCHEDULE : [],
      efficiencyScore: isDemoMode ? DEMO_EFFICIENCY_SCORE : 0,
    }),

  addTask: (task) => {
    const { tasks } = get();
    if (tasks.length >= FREE_TASK_LIMIT) {
      set({ paywallOpen: true });
      return;
    }
    const newTask: Task = { ...task, id: `task-${Date.now()}`, done: false };
    set({ tasks: [...tasks, newTask] });
    const userId = useAuthStore.getState().user?.uid;
    if (!isDemoMode && userId) {
      addTaskToFirestore(userId, newTask).catch(console.error);
    }
  },

  removeTask: (id) => {
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      schedule: s.schedule.filter((b) => b.taskId !== id),
    }));
    const userId = useAuthStore.getState().user?.uid;
    if (!isDemoMode && userId) {
      deleteTaskFromFirestore(userId, id).catch(console.error);
    }
  },

  toggleTask: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const newDone = !task.done;
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: newDone } : t)),
    }));
    const userId = useAuthStore.getState().user?.uid;
    if (!isDemoMode && userId) {
      updateTaskInFirestore(userId, id, { done: newDone }).catch(console.error);
    }
  },

  enterCockpit: (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    set({
      activeTaskId: taskId,
      cockpitSecondsLeft: COCKPIT_DURATION_SEC,
      cockpitRunning: false,
      cockpitSession: task
        ? { taskId, taskTitle: task.title, startedAt: new Date() }
        : null,
    });
    if (task) {
      writeSessionToExtension(taskId, task.title, COCKPIT_DURATION_SEC);
    }
  },

  exitCockpit: (completed = false) => {
    const { cockpitSession } = get();
    const userId = useAuthStore.getState().user?.uid;
    if (cockpitSession && !isDemoMode && userId) {
      const endedAt = new Date();
      const durationSec = Math.round(
        (endedAt.getTime() - cockpitSession.startedAt.getTime()) / 1000,
      );
      const session: SessionData = {
        taskId: cockpitSession.taskId,
        taskTitle: cockpitSession.taskTitle,
        startedAt: cockpitSession.startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationSec,
        completed,
      };
      saveSessionToFirestore(userId, session).catch(console.error);
    }
    clearSessionFromExtension();
    set({
      activeTaskId: null,
      cockpitRunning: false,
      cockpitSecondsLeft: COCKPIT_DURATION_SEC,
      cockpitSession: null,
    });
  },

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

  runScheduler: (gaps) => {
    const { tasks } = get();
    const calendarGaps = gaps ?? DEMO_CALENDAR_GAPS;
    const engineTasks = tasks.map(toEngineTask);
    const focusBlocks = buildSchedule(engineTasks, calendarGaps);
    const scheduleBlocks = focusBlocks.map(focusBlockToScheduleBlock);
    const WORKDAY_MIN = 8 * 60;
    const score = calculateEfficiencyScore(focusBlocks, WORKDAY_MIN);
    set({ schedule: scheduleBlocks, efficiencyScore: score });
    const userId = useAuthStore.getState().user?.uid;
    if (!isDemoMode && userId) {
      const todayDateString = new Date().toISOString().split('T')[0];
      saveScheduleToFirestore(userId, todayDateString, focusBlocks).catch(console.error);
    }
  },
}));
