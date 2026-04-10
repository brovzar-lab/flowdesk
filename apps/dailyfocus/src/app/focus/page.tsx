'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Task } from '@/lib/types';
import { endFocusSession, getTodayData, startFocusSession } from '@/lib/supabase/queries';
import FocusTimer from '@/components/FocusTimer';
import BottomNav from '@/components/BottomNav';

function FocusContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const taskIdParam = searchParams.get('taskId');
  const titleParam = searchParams.get('title');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const load = useCallback(async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUserId(user.id);

    const { tasks: fetched } = await getTodayData(supabase, user.id);
    const activeTasks = fetched.filter((t) => t.status !== 'done');
    setTasks(activeTasks);

    // Pre-select task from URL params
    if (taskIdParam) {
      const found = fetched.find((t) => t.id === taskIdParam);
      if (found) setSelectedTask(found);
    }

    setLoading(false);
  }, [router, supabase, taskIdParam]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      void load();
    }
  }, [load]);

  async function handleSessionEnd(durationSeconds: number): Promise<void> {
    if (sessionId) {
      await endFocusSession(supabase, sessionId);
      setSessionId(null);
    }
    // Log duration
    console.log(`Session ended: ${Math.round(durationSeconds / 60)} min`);
  }

  async function handleStartSession(task: Task): Promise<void> {
    if (!userId) return;
    setSelectedTask(task);
    const session = await startFocusSession(supabase, task.id, userId);
    setSessionId(session.id);
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="px-5 pt-10 pb-5">
        <h1 className="text-2xl font-bold text-slate-900">Focus Timer</h1>
        <p className="text-sm text-slate-400 mt-1">Deep work, 25 minutes at a time.</p>
      </header>

      <main className="flex-1 px-4 pb-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : selectedTask ? (
          <div className="py-4">
            <FocusTimer
              taskTitle={selectedTask.title}
              onSessionEnd={handleSessionEnd}
              onCancel={() => {
                setSelectedTask(null);
                setSessionId(null);
              }}
            />
          </div>
        ) : tasks.length === 0 ? (
          <div className="card text-center py-10">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-semibold text-slate-900">All tasks done!</p>
            <p className="text-sm text-slate-400 mt-1">Go set tomorrow's MITs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500 mb-2">Select a task to focus on:</p>
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => void handleStartSession(task)}
                className="card w-full text-left hover:border-primary-300 hover:shadow-md
                           transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600
                                  flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    {task.position}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{task.title}</p>
                    {task.note && (
                      <p className="text-sm text-slate-400 truncate">{task.note}</p>
                    )}
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                       className="w-5 h-5 text-slate-300 flex-shrink-0 ml-auto">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default function FocusPage(): React.JSX.Element {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <FocusContent />
    </Suspense>
  );
}
