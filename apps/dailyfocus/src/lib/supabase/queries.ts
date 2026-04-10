import type { SupabaseClient } from '@supabase/supabase-js';
import type { DayPlan, FocusSession, Task, TodayData } from '../types';

export async function getTodayData(
  supabase: SupabaseClient,
  userId: string
): Promise<TodayData> {
  const today = new Date().toISOString().split('T')[0];

  const { data: plan } = await supabase
    .from('day_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (!plan) {
    return { plan: null, tasks: [] };
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('day_plan_id', plan.id)
    .order('position');

  return {
    plan: mapPlan(plan),
    tasks: (tasks ?? []).map(mapTask),
  };
}

export async function getOrCreateTodayPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<DayPlan> {
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('day_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (existing) return mapPlan(existing);

  const { data: created, error } = await supabase
    .from('day_plans')
    .insert({ user_id: userId, date: today })
    .select()
    .single();

  if (error || !created) throw new Error('Failed to create day plan');
  return mapPlan(created);
}

export async function upsertTask(
  supabase: SupabaseClient,
  task: Partial<Task> & { dayPlanId: string; position: 1 | 2 | 3 }
): Promise<Task> {
  const payload = {
    day_plan_id: task.dayPlanId,
    title: task.title ?? '',
    note: task.note ?? null,
    position: task.position,
    status: task.status ?? 'todo',
    completed_at: task.completedAt ?? null,
  };

  if (task.id) {
    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', task.id)
      .select()
      .single();
    if (error || !data) throw new Error('Failed to update task');
    return mapTask(data);
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select()
    .single();
  if (error || !data) throw new Error('Failed to create task');
  return mapTask(data);
}

export async function updateTaskStatus(
  supabase: SupabaseClient,
  taskId: string,
  status: Task['status']
): Promise<void> {
  const completedAt = status === 'done' ? new Date().toISOString() : null;
  const { error } = await supabase
    .from('tasks')
    .update({ status, completed_at: completedAt })
    .eq('id', taskId);
  if (error) throw new Error('Failed to update task status');
}

export async function startFocusSession(
  supabase: SupabaseClient,
  taskId: string,
  userId: string
): Promise<FocusSession> {
  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({ task_id: taskId, user_id: userId, started_at: new Date().toISOString() })
    .select()
    .single();
  if (error || !data) throw new Error('Failed to start focus session');
  return mapSession(data);
}

export async function endFocusSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  const endedAt = new Date().toISOString();
  const { data: session } = await supabase
    .from('focus_sessions')
    .select('started_at')
    .eq('id', sessionId)
    .single();

  const durationMinutes = session
    ? Math.round((new Date(endedAt).getTime() - new Date(session.started_at).getTime()) / 60000)
    : null;

  const { error } = await supabase
    .from('focus_sessions')
    .update({ ended_at: endedAt, duration_minutes: durationMinutes })
    .eq('id', sessionId);
  if (error) throw new Error('Failed to end focus session');
}

export async function getYesterdayTasks(
  supabase: SupabaseClient,
  userId: string
): Promise<Task[]> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  const { data: plan } = await supabase
    .from('day_plans')
    .select('id')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .single();

  if (!plan) return [];

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('day_plan_id', plan.id)
    .eq('status', 'todo')
    .order('position');

  return (tasks ?? []).map(mapTask);
}

// Row mappers (snake_case DB → camelCase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPlan(row: any): DayPlan {
  return { id: row.id, userId: row.user_id, date: row.date, createdAt: row.created_at };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTask(row: any): Task {
  return {
    id: row.id,
    dayPlanId: row.day_plan_id,
    title: row.title,
    note: row.note,
    position: row.position,
    status: row.status,
    completedAt: row.completed_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSession(row: any): FocusSession {
  return {
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationMinutes: row.duration_minutes,
  };
}
