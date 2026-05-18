export type CognitiveLoad = 'deep' | 'shallow' | 'meeting';

export interface EngineTask {
  id: string;
  title: string;
  durationMin: 25 | 50;
  cognitiveLoad: CognitiveLoad;
  status: 'pending' | 'scheduled' | 'done';
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface FocusBlock {
  start: Date;
  end: Date;
  task: EngineTask;
  type: CognitiveLoad;
}

const LOAD_ORDER: Record<CognitiveLoad, number> = { deep: 0, shallow: 1, meeting: 2 };
const BUFFER_MS = 5 * 60 * 1000;

export function buildSchedule(tasks: EngineTask[], calendarGaps: TimeRange[]): FocusBlock[] {
  const blocks: FocusBlock[] = [];

  const sortedGaps = [...calendarGaps].sort((a, b) => a.start.getTime() - b.start.getTime());

  const sorted = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => LOAD_ORDER[a.cognitiveLoad] - LOAD_ORDER[b.cognitiveLoad]);

  const deepQueue = sorted.filter((t) => t.cognitiveLoad === 'deep');
  const shallowQueue = sorted.filter((t) => t.cognitiveLoad === 'shallow');
  const meetingQueue = sorted.filter((t) => t.cognitiveLoad === 'meeting');

  for (const gap of sortedGaps) {
    let cursor = gap.start.getTime();
    const gapEnd = gap.end.getTime();

    while (cursor < gapEnd) {
      const remainingMin = (gapEnd - cursor) / 60000;
      if (remainingMin < 25) break;

      let task: EngineTask | undefined;
      let duration: number;

      if (remainingMin >= 50 && deepQueue.length > 0) {
        task = deepQueue.shift();
        duration = 50;
      } else if (shallowQueue.length > 0) {
        task = shallowQueue.shift();
        duration = 25;
      } else if (meetingQueue.length > 0) {
        task = meetingQueue.shift();
        duration = task!.durationMin;
      } else if (deepQueue.length > 0) {
        // Deep task in a shorter-than-ideal slot
        task = deepQueue.shift();
        duration = 25;
      }

      if (!task) break;

      const start = new Date(cursor);
      const end = new Date(cursor + duration! * 60000);
      blocks.push({ start, end, task, type: task.cognitiveLoad });
      cursor = end.getTime() + BUFFER_MS;
    }
  }

  return blocks.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function calculateEfficiencyScore(
  blocks: FocusBlock[],
  availableWorkdayMinutes: number,
): number {
  if (availableWorkdayMinutes === 0 || blocks.length === 0) return 0;
  const totalFocusMin = blocks.reduce(
    (sum, b) => sum + (b.end.getTime() - b.start.getTime()) / 60000,
    0,
  );
  const totalDeep = Math.max(1, blocks.filter((b) => b.type === 'deep').length);
  const completedDeep = blocks.filter(
    (b) => b.type === 'deep' && b.task.status === 'done',
  ).length;
  return Math.round((totalFocusMin / availableWorkdayMinutes) * (completedDeep / totalDeep) * 100);
}
