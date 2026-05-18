export type TaskType = 'deep' | 'meeting' | 'shallow';

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  durationMin: number;
  done: boolean;
}

export interface ScheduleBlock {
  id: string;
  taskId: string;
  title: string;
  type: TaskType;
  startHour: number;
  startMin: number;
  durationMin: number;
}

export const TYPE_COLORS: Record<TaskType, string> = {
  deep: '#7C3AED',
  meeting: '#2563EB',
  shallow: '#059669',
};

export const TYPE_LABELS: Record<TaskType, string> = {
  deep: 'Deep Work',
  meeting: 'Meeting',
  shallow: 'Shallow',
};

export const TYPE_DOT: Record<TaskType, string> = {
  deep: 'bg-purple-600',
  meeting: 'bg-blue-600',
  shallow: 'bg-emerald-600',
};

export const TYPE_BADGE: Record<TaskType, string> = {
  deep: 'bg-purple-900/60 text-purple-300 border-purple-700',
  meeting: 'bg-blue-900/60 text-blue-300 border-blue-700',
  shallow: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
};

export const TYPE_BLOCK_BG: Record<TaskType, string> = {
  deep: 'bg-purple-900/70 border-purple-700',
  meeting: 'bg-blue-900/70 border-blue-700',
  shallow: 'bg-emerald-900/70 border-emerald-700',
};
