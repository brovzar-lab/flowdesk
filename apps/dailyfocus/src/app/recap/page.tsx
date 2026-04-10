'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Task } from '@/lib/types';
import {
  getOrCreateTodayPlan,
  getTodayData,
  getYesterdayTasks,
  updateTaskStatus,
  upsertTask,
} from '@/lib/supabase/queries';
import BottomNav from '@/components/BottomNav';

type RecapTask = Task & { isCarryover?: boolean };

export default function RecapPage(): React.JSX.Element {
  const router = useRouter();
  const supabase = createClient();
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [carryoverCandidates, setCarryoverCandidates] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [todayPlanId, setTodayPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const initialized = useRef(false);

  const load = useCallback(async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUserId(user.id);

    const [{ plan, tasks }, yesterday] = await Promise.all([
      getTodayData(supabase, user.id),
      getYesterdayTasks(supabase, user.id),
    ]);

    setTodayPlanId(plan?.id ?? null);
    setTodayTasks(tasks);
    setCarryoverCandidates(yesterday);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      void load();
    }
  }, [load]);

  async function handleToggleDone(task: Task): Promise<void> {
    const newStatus: Task['status'] = task.status === 'done' ? 'todo' : 'done';
    setSaving(task.id);
    await updateTaskStatus(supabase, task.id, newStatus);
    setTodayTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: newStatus, completedAt: newStatus === 'done' ? new Date().toISOString() : null }
          : t
      )
    );
    setSaving(null);
  }

  async function handleCarryOver(task: Task): Promise<void> {
    if (!userId) return;
    setSaving(task.id);

    // First mark source as carried_over
    await updateTaskStatus(supabase, task.id, 'carried_over');

    // Get or create today's plan
    let planId = todayPlanId;
    if (!planId) {
      const plan = await getOrCreateTodayPlan(supabase, userId);
      planId = plan.id;
      setTodayPlanId(planId);
    }

    // Find an open slot in today's tasks
    const usedPositions = new Set(todayTasks.map((t) => t.position));
    const openSlot = ([1, 2, 3] as const).find((p) => !usedPositions.has(p));

    if (openSlot) {
      const newTask = await upsertTask(supabase, {
        dayPlanId: planId,
        title: task.title,
        note: task.note,
        position: openSlot,
        status: 'todo',
      });
      setTodayTasks((prev) => [...prev, newTask]);
    }

    setCarryoverCandidates((prev) => prev.filter((t) => t.id !== task.id));
    setSaving(null);
  }

  const doneCount = todayTasks.filter((t) => t.status === 'done').length;
  const totalCount = todayTasks.length;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col flex-1">
      <header className="px-5 pt-10 pb-5">
        <p className="text-sm text-slate-400 font-medium mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-slate-900">End-of-Day Recap</h1>
        <p className="text-sm text-slate-400 mt-1">How did today go?</p>
      </header>

      <main className="flex-1 px-4 pb-4 space-y-6 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary card */}
            {totalCount > 0 && (
              <div className="card bg-gradient-to-br from-primary-50 to-white">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {doneCount === totalCount ? '🎉' : doneCount > 0 ? '💪' : '🌱'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg">
                      {doneCount}/{totalCount} tasks complete
                    </p>
                    <p className="text-sm text-slate-400">
                      {doneCount === totalCount
                        ? 'Perfect day! All MITs done.'
                        : doneCount > 0
                        ? 'Good progress. Keep going!'
                        : "Tomorrow's a new start."}
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4 h-2 bg-surface-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            )}

            {/* Today's tasks */}
            {todayTasks.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Today's MITs
                </h2>
                <div className="space-y-2">
                  {todayTasks.map((task) => (
                    <div key={task.id} className="card flex items-center gap-3">
                      <button
                        onClick={() => void handleToggleDone(task)}
                        disabled={saving === task.id}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                          transition-colors ${task.status === 'done'
                            ? 'bg-primary-500 border-primary-500 text-white'
                            : 'border-slate-300 hover:border-primary-400'}`}
                      >
                        {task.status === 'done' && (
                          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
                            <path d="M2 6l3 3 5-5" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${task.status === 'done'
                          ? 'line-through text-slate-400'
                          : 'text-slate-900'}`}>
                          {task.title}
                        </p>
                        {task.note && (
                          <p className="text-xs text-slate-400 truncate">{task.note}</p>
                        )}
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0
                        ${task.status === 'done'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'}`}>
                        {task.status === 'done' ? 'Done' : 'Todo'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Carryover from yesterday */}
            {carryoverCandidates.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  From yesterday
                </h2>
                <p className="text-sm text-slate-400 mb-3">
                  These didn't get done. Carry them into today?
                </p>
                <div className="space-y-2">
                  {carryoverCandidates.map((task) => (
                    <div key={task.id} className="card flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-700">{task.title}</p>
                        {task.note && (
                          <p className="text-xs text-slate-400 truncate">{task.note}</p>
                        )}
                      </div>
                      <button
                        onClick={() => void handleCarryOver(task)}
                        disabled={saving === task.id || todayTasks.length >= 3}
                        className="flex-shrink-0 text-sm font-medium text-primary-600
                                   hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed
                                   px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                      >
                        {saving === task.id ? '…' : 'Add to today'}
                      </button>
                    </div>
                  ))}
                </div>
                {todayTasks.length >= 3 && (
                  <p className="text-xs text-slate-400 mt-2">
                    Today's slots are full. Complete or clear a task first.
                  </p>
                )}
              </section>
            )}

            {/* Empty state */}
            {totalCount === 0 && carryoverCandidates.length === 0 && (
              <div className="card text-center py-10">
                <div className="text-4xl mb-3">🌅</div>
                <p className="font-semibold text-slate-900">Fresh start!</p>
                <p className="text-sm text-slate-400 mt-1">
                  Go set your MITs for today.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
