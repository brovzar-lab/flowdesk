import { create } from 'zustand';
import type { Task, ScheduleBlock } from './types';
import { isDemoMode, COCKPIT_DURATION_SEC, FREE_TASK_LIMIT } from './config';
import { DEMO_TASKS, DEMO_SCHEDULE, DEMO_EFFICIENCY_SCORE } from '../demo/seed';
import { buildSchedule, calculateEfficiencyScore } from './schedulingEngine';
import type { EngineTask, TimeRange } from './schedulingEngine';
import { DEMO_CALENDAR_GAPS, fetchTodayCalendarGaps, writeCalendarEvents } from './googleCalendar';
import { writeSessionToExtension, clearSessionFromExtension } from './chromeBridge';
import type { Tier } from './firestore';
import { updateCalendarSyncAt } from './firestore';
import { auth } from './firebase';

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
    startIso: b.start.toISOString(),
    endIso: b.end.toISOString(),
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
  tier: Tier;
  isPlanningLoading: boolean;
  planningRationale: string | null;

  signInDemo: () => void;
  signOut: () => void;
  setTier: (tier: Tier) => void;
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
  clearRationale: () => void;
  runScheduler: (gaps?: TimeRange[]) => void;
  runAiScheduler: (accessToken: string | null, userId: string | null) => Promise<void>;
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
  tier: 'free',
  isPlanningLoading: false,
  planningRationale: null,

  signInDemo: () => set({ isAuthenticated: true }),
  signOut: () =>
    set({
      isAuthenticated: isDemoMode,
      tasks: isDemoMode ? DEMO_TASKS : [],
      schedule: isDemoMode ? DEMO_SCHEDULE : [],
      efficiencyScore: isDemoMode ? DEMO_EFFICIENCY_SCORE : 0,
      tier: 'free',
    }),

  setTier: (tier) => set({ tier }),

  addTask: (task) => {
    const { tasks, tier } = get();
    if (tier !== 'pro' && tasks.length >= FREE_TASK_LIMIT) {
      set({ paywallOpen: true });
      return;
    }
    const newTask: Task = { ...task, id: `task-${Date.now()}`, done: false };
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
    if (cockpitSession && !isDemoMode) {
      const endedAt = new Date();
      const durationSec = Math.round(
        (endedAt.getTime() - cockpitSession.startedAt.getTime()) / 1000,
      );
      console.debug('[FlowDesk] session', { ...cockpitSession, endedAt, durationSec, completed });
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
  clearRationale: () => set({ planningRationale: null }),

  runScheduler: (gaps) => {
    const { tasks } = get();
    const calendarGaps = gaps ?? DEMO_CALENDAR_GAPS;
    const engineTasks = tasks.map(toEngineTask);
    const focusBlocks = buildSchedule(engineTasks, calendarGaps);
    const scheduleBlocks = focusBlocks.map(focusBlockToScheduleBlock);
    const WORKDAY_MIN = 8 * 60;
    const score = calculateEfficiencyScore(focusBlocks, WORKDAY_MIN);
    set({ schedule: scheduleBlocks, efficiencyScore: score });
  },

  runAiScheduler: async (accessToken, userId) => {
    const { tasks } = get();

    if (isDemoMode || !import.meta.env.VITE_PLANNING_PROXY_URL) {
      get().runScheduler();
      return;
    }

    set({ isPlanningLoading: true, planningRationale: null });

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const calendarGaps = await fetchTodayCalendarGaps(accessToken ?? '');

      const calendarEvents = calendarGaps.map((gap) => ({
        start: { dateTime: gap.start.toISOString() },
        end: { dateTime: gap.end.toISOString() },
      }));

      const response = await fetch(
        `${import.meta.env.VITE_PLANNING_PROXY_URL}/plan/daily`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tasks: tasks.filter((t) => !t.done).map((t) => ({
              id: t.id,
              title: t.title,
              type: t.type,
              durationMin: t.durationMin,
            })),
            calendarEvents,
            workdayStart: '08:00',
            workdayEnd: '18:00',
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Proxy returned ${response.status}`);
      }

      const { schedule: aiSchedule, rationale } = await response.json() as {
        schedule: Array<{ taskId: string; title: string; type: string; startIso: string; endIso: string }>;
        rationale: string;
      };

      const scheduleBlocks: ScheduleBlock[] = aiSchedule.map((block, idx) => {
        const start = new Date(block.startIso);
        const end = new Date(block.endIso);
        return {
          id: `ai-block-${block.taskId}-${idx}`,
          taskId: block.taskId,
          title: block.title,
          type: block.type as ScheduleBlock['type'],
          startHour: start.getHours(),
          startMin: start.getMinutes(),
          durationMin: (end.getTime() - start.getTime()) / 60000,
          startIso: block.startIso,
          endIso: block.endIso,
        };
      });

      const WORKDAY_MIN = 8 * 60;
      const engineBlocks = aiSchedule.map((b) => ({
        start: new Date(b.startIso),
        end: new Date(b.endIso),
        task: { id: b.taskId, title: b.title, durationMin: 25 as const, cognitiveLoad: b.type as 'deep' | 'shallow' | 'meeting', status: 'pending' as const },
        type: b.type as 'deep' | 'shallow' | 'meeting',
      }));
      const score = calculateEfficiencyScore(engineBlocks, WORKDAY_MIN);

      set({ schedule: scheduleBlocks, efficiencyScore: score, planningRationale: rationale });

      // Write blocks to Google Calendar and update sync timestamp
      if (accessToken && userId) {
        try {
          await writeCalendarEvents(accessToken, scheduleBlocks);
          await updateCalendarSyncAt(userId);
        } catch (calErr) {
          console.warn('[FlowDesk] Calendar write-back failed', calErr);
        }
      }
    } catch (err) {
      console.warn('[FlowDesk] AI planning failed, falling back to local scheduler', err);
      get().runScheduler();
    } finally {
      set({ isPlanningLoading: false });
    }
  },
}));
