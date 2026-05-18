import { useEffect, useMemo } from 'react';
import { isDemoMode } from '../lib/config';
import { useAuthStore, signOutUser } from '../lib/auth';
import { useTasks, useSchedule } from '../lib/firestore';
import { useStore } from '../lib/store';
import type { ScheduleBlock, TaskType } from '../lib/types';
import DemoBanner from '../components/DemoBanner';
import TaskList from '../components/TaskList';
import ScheduleTimeline from '../components/ScheduleTimeline';
import PaywallModal from '../components/PaywallModal';

export default function MainScreen() {
  const userId = useAuthStore((s) => (isDemoMode ? null : (s.user?.uid ?? null)));
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const { tasks: firestoreTasks, loading: tasksLoading } = useTasks(userId);
  const { data: savedSchedule } = useSchedule(userId, today);

  // Hydrate store with Firestore tasks after initial load
  useEffect(() => {
    if (isDemoMode || !userId || tasksLoading) return;
    useStore.setState({ tasks: firestoreTasks });
  }, [firestoreTasks, tasksLoading, userId]);

  // Hydrate store with saved schedule if blocks exist
  useEffect(() => {
    if (isDemoMode || !userId || !savedSchedule?.blocks.length) return;
    const blocks: ScheduleBlock[] = savedSchedule.blocks.map((b, i) => {
      const start = new Date(b.startIso);
      const end = new Date(b.endIso);
      return {
        id: `block-${b.taskId}-${i}`,
        taskId: b.taskId,
        title: b.taskTitle,
        type: b.type as TaskType,
        startHour: start.getHours(),
        startMin: start.getMinutes(),
        durationMin: (end.getTime() - start.getTime()) / 60000,
      };
    });
    useStore.setState({ schedule: blocks });
  }, [savedSchedule, userId]);

  return (
    <div className="flex flex-col h-full bg-navy-900">
      {isDemoMode && <DemoBanner />}

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="text-sm font-bold text-slate-100 tracking-wide">FlowDesk</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600">Monday · May 18</span>
          {!isDemoMode && (
            <button
              onClick={() => signOutUser()}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Sign out
            </button>
          )}
        </div>
      </div>

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Task list */}
        <div className="w-80 flex-shrink-0 border-r border-slate-800 flex flex-col overflow-hidden relative">
          <TaskList />
        </div>

        {/* Right: Schedule timeline */}
        <div className="flex-1 overflow-hidden">
          <ScheduleTimeline />
        </div>
      </div>

      <PaywallModal />
    </div>
  );
}
