import type { Task, ScheduleBlock } from '../lib/types';

export const DEMO_TASKS: Task[] = [
  { id: 'task-001', title: 'Write API spec', type: 'deep', durationMin: 50, done: false },
  { id: 'task-002', title: 'Team standup', type: 'meeting', durationMin: 25, done: false },
  { id: 'task-003', title: 'Review PRs', type: 'deep', durationMin: 50, done: false },
  { id: 'task-004', title: 'Respond to emails', type: 'shallow', durationMin: 25, done: false },
  { id: 'task-005', title: 'Update docs', type: 'shallow', durationMin: 25, done: false },
];

export const DEMO_SCHEDULE: ScheduleBlock[] = [
  {
    id: 'block-001',
    taskId: 'task-001',
    title: 'Write API spec',
    type: 'deep',
    startHour: 9,
    startMin: 0,
    durationMin: 50,
  },
  {
    id: 'block-002',
    taskId: 'task-002',
    title: 'Team standup',
    type: 'meeting',
    startHour: 10,
    startMin: 0,
    durationMin: 25,
  },
  {
    id: 'block-003',
    taskId: 'task-003',
    title: 'Review PRs',
    type: 'deep',
    startHour: 10,
    startMin: 30,
    durationMin: 50,
  },
  {
    id: 'block-004',
    taskId: 'task-004',
    title: 'Respond to emails',
    type: 'shallow',
    startHour: 13,
    startMin: 0,
    durationMin: 25,
  },
  {
    id: 'block-005',
    taskId: 'task-005',
    title: 'Update docs',
    type: 'shallow',
    startHour: 13,
    startMin: 30,
    durationMin: 25,
  },
];

export const DEMO_EFFICIENCY_SCORE = 73;

export function formatBlockTime(block: ScheduleBlock): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const endMin = block.startMin + block.durationMin;
  const endHour = block.startHour + Math.floor(endMin / 60);
  const endMinRem = endMin % 60;
  const startAmPm = block.startHour >= 12 ? 'PM' : 'AM';
  const endAmPm = endHour >= 12 ? 'PM' : 'AM';
  const startH = block.startHour > 12 ? block.startHour - 12 : block.startHour;
  const endH = endHour > 12 ? endHour - 12 : endHour;
  return `${startH}:${pad(block.startMin)} ${startAmPm} – ${endH}:${pad(endMinRem)} ${endAmPm}`;
}

export function getDeepWorkMinutes(tasks: Task[]): number {
  return tasks.filter((t) => t.type === 'deep').reduce((sum, t) => sum + t.durationMin, 0);
}

export function getScheduledMinutesByType(blocks: ScheduleBlock[]): Record<string, number> {
  return blocks.reduce<Record<string, number>>((acc, b) => {
    acc[b.type] = (acc[b.type] ?? 0) + b.durationMin;
    return acc;
  }, {});
}
