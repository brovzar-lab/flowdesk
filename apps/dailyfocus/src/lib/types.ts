export type TaskStatus = 'todo' | 'done' | 'carried_over';

export type User = {
  id: string;
  email: string;
  timezone: string;
  reminderTime: string; // HH:MM e.g. "08:00"
  createdAt: string;
};

export type DayPlan = {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
};

export type Task = {
  id: string;
  dayPlanId: string;
  title: string;
  note: string | null;
  position: 1 | 2 | 3;
  status: TaskStatus;
  completedAt: string | null;
};

export type FocusSession = {
  id: string;
  taskId: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
};

// View models
export type TodayData = {
  plan: DayPlan | null;
  tasks: Task[];
};
