export type TaskType = 'deep' | 'meeting' | 'shallow';

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  durationMin: number;
  done: boolean;
}

export interface CalendarEvent {
  start: string;
  end: string;
  title: string;
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

export interface PlanDailyRequest {
  tasks: Task[];
  calendarEvents: CalendarEvent[];
  workdayStart: number;
  workdayEnd: number;
}

export interface PlanDailyResponse {
  schedule: ScheduleBlock[];
  rationale: string;
}

export interface ClaudeScheduleOutput {
  schedule: ScheduleBlock[];
  rationale: string;
}
