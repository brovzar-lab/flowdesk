'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Task } from '@/lib/types';
import {
  getOrCreateTodayPlan,
  getTodayData,
  updateTaskStatus,
  upsertTask,
} from '@/lib/supabase/queries';
import TaskCard from '@/components/TaskCard';
import BottomNav from '@/components/BottomNav';

const POSITIONS = [1, 2, 3] as const;

export default function TodayPage(): React.JSX.Element {
  const router = useRouter();
  const supabase = createClient();
  const [tasks, setTasks] = useState<(Task | null)[]>([null, null, null]);
  const [dayPlanId, setDayPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const initialized = useRef(false);

  const load = useCallback(async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUserId(user.id);

    const { plan, tasks: fetched } = await getTodayData(supabase, user.id);
    setDayPlanId(plan?.id ?? null);

    const slots: (Task | null)[] = [null, null, null];
    fetched.forEach((t) => { slots[t.position - 1] = t; });
    setTasks(slots);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      void load();
    }
  }, [load]);

  async function handleSave(position: 1 | 2 | 3, title: string, note: string): Promise<void> {
    if (!userId) return;
    let planId = dayPlanId;
    if (!planId) {
      const plan = await getOrCreateTodayPlan(supabase, userId);
      planId = plan.id;
      setDayPlanId(planId);
    }
    const existing = tasks[position - 1];
    const saved = await upsertTask(supabase, {
      id: existing?.id,
      dayPlanId: planId,
      position,
      title,
      note,
    });
    setTasks((prev) => {
      const next = [...prev];
      next[position - 1] = saved;
      return next;
    });
  }

  async function handleStatusChange(taskId: string, status: Task['status']): Promise<void> {
    await updateTaskStatus(supabase, taskId, status);
    setTasks((prev) =>
      prev.map((t) =>
        t?.id === taskId
          ? { ...t, status, completedAt: status === 'done' ? new Date().toISOString() : null }
          : t
      )
    );
  }

  function handleFocus(task: Task): void {
    router.push(`/focus?taskId=${task.id}&title=${encodeURIComponent(task.title)}`);
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const doneCount = tasks.filter((t) => t?.status === 'done').length;
  const totalCount = tasks.filter(Boolean).length;

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <header className="px-5 pt-10 pb-5">
        <p className="text-sm text-slate-400 font-medium mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-slate-900">Today's Focus</h1>
        {totalCount > 0 && (
          <p className="text-sm text-slate-400 mt-1">
            {doneCount}/{totalCount} tasks complete
          </p>
        )}
      </header>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="px-5 mb-4">
          <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${(doneCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Task cards */}
      <main className="flex-1 px-4 pb-4 space-y-3 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {POSITIONS.map((pos) => (
              <TaskCard
                key={pos}
                task={tasks[pos - 1]}
                position={pos}
                onSave={(title, note) => handleSave(pos, title, note)}
                onStatusChange={handleStatusChange}
                onFocus={handleFocus}
              />
            ))}

            {/* All done celebration */}
            {totalCount === 3 && doneCount === 3 && (
              <div className="card text-center py-6">
                <div className="text-4xl mb-2">🎉</div>
                <p className="font-bold text-slate-900 text-lg">All done!</p>
                <p className="text-slate-400 text-sm mt-1">
                  You crushed your MITs today.
                </p>
              </div>
            )}

            {/* Hint when no tasks set */}
            {totalCount === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">
                  Tap any slot above to set your MITs for today.
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
