import { describe, it, expect } from 'vitest';
import {
  DEMO_TASKS,
  DEMO_SCHEDULE,
  DEMO_EFFICIENCY_SCORE,
  formatBlockTime,
  getDeepWorkMinutes,
  getScheduledMinutesByType,
} from './seed';

describe('DEMO_TASKS', () => {
  it('has exactly 5 tasks', () => {
    expect(DEMO_TASKS).toHaveLength(5);
  });

  it('all tasks have valid types', () => {
    const validTypes = new Set(['deep', 'meeting', 'shallow']);
    DEMO_TASKS.forEach((t) => {
      expect(validTypes.has(t.type)).toBe(true);
    });
  });

  it('includes deep work tasks', () => {
    const deepTasks = DEMO_TASKS.filter((t) => t.type === 'deep');
    expect(deepTasks.length).toBeGreaterThan(0);
  });

  it('all tasks have positive durationMin', () => {
    DEMO_TASKS.forEach((t) => {
      expect(t.durationMin).toBeGreaterThan(0);
    });
  });

  it('all tasks start as not done', () => {
    DEMO_TASKS.forEach((t) => {
      expect(t.done).toBe(false);
    });
  });
});

describe('DEMO_SCHEDULE', () => {
  it('has exactly 5 blocks matching tasks', () => {
    expect(DEMO_SCHEDULE).toHaveLength(5);
  });

  it('all blocks reference a valid taskId', () => {
    const taskIds = new Set(DEMO_TASKS.map((t) => t.id));
    DEMO_SCHEDULE.forEach((b) => {
      expect(taskIds.has(b.taskId)).toBe(true);
    });
  });

  it('blocks are ordered by start time', () => {
    const startMinutes = DEMO_SCHEDULE.map((b) => b.startHour * 60 + b.startMin);
    for (let i = 1; i < startMinutes.length; i++) {
      expect(startMinutes[i]).toBeGreaterThanOrEqual(startMinutes[i - 1]);
    }
  });
});

describe('formatBlockTime', () => {
  it('formats 9:00 AM + 50 min correctly', () => {
    const block = DEMO_SCHEDULE[0];
    expect(formatBlockTime(block)).toBe('9:00 AM – 9:50 AM');
  });

  it('formats 10:00 AM + 25 min correctly', () => {
    const block = DEMO_SCHEDULE[1];
    expect(formatBlockTime(block)).toBe('10:00 AM – 10:25 AM');
  });

  it('formats 1:00 PM + 25 min correctly', () => {
    const block = DEMO_SCHEDULE[3];
    expect(formatBlockTime(block)).toBe('1:00 PM – 1:25 PM');
  });
});

describe('getDeepWorkMinutes', () => {
  it('sums only deep work tasks', () => {
    const result = getDeepWorkMinutes(DEMO_TASKS);
    expect(result).toBe(100);
  });

  it('returns 0 for empty list', () => {
    expect(getDeepWorkMinutes([])).toBe(0);
  });
});

describe('getScheduledMinutesByType', () => {
  it('counts deep, meeting, and shallow minutes', () => {
    const result = getScheduledMinutesByType(DEMO_SCHEDULE);
    expect(result['deep']).toBe(100);
    expect(result['meeting']).toBe(25);
    expect(result['shallow']).toBe(50);
  });
});

describe('DEMO_EFFICIENCY_SCORE', () => {
  it('is 73', () => {
    expect(DEMO_EFFICIENCY_SCORE).toBe(73);
  });
});
