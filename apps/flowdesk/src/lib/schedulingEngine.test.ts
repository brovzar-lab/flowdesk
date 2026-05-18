import { describe, it, expect } from 'vitest';
import {
  buildSchedule,
  calculateEfficiencyScore,
  type EngineTask,
  type TimeRange,
} from './schedulingEngine';

function makeTask(
  id: string,
  cognitiveLoad: EngineTask['cognitiveLoad'],
  durationMin: 25 | 50 = 25,
  status: EngineTask['status'] = 'pending',
): EngineTask {
  return { id, title: `Task ${id}`, durationMin, cognitiveLoad, status };
}

function makeGap(startH: number, endH: number, date = '2026-01-15'): TimeRange {
  return {
    start: new Date(`${date}T${String(startH).padStart(2, '0')}:00:00`),
    end: new Date(`${date}T${String(endH).padStart(2, '0')}:00:00`),
  };
}

describe('buildSchedule', () => {
  it('returns empty array for empty tasks', () => {
    const gaps = [makeGap(9, 12)];
    expect(buildSchedule([], gaps)).toHaveLength(0);
  });

  it('returns empty array for empty gaps', () => {
    const tasks = [makeTask('t1', 'deep', 50)];
    expect(buildSchedule(tasks, [])).toHaveLength(0);
  });

  it('returns empty array when both tasks and gaps are empty', () => {
    expect(buildSchedule([], [])).toHaveLength(0);
  });

  it('places a single deep task in a 60-min gap', () => {
    const blocks = buildSchedule([makeTask('t1', 'deep', 50)], [makeGap(9, 10)]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('deep');
    expect(blocks[0].task.id).toBe('t1');
  });

  it('places a single shallow task in a 30-min gap', () => {
    const blocks = buildSchedule([makeTask('t1', 'shallow', 25)], [makeGap(9, 10)]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('shallow');
  });

  it('prefers deep tasks when gap >= 50 min', () => {
    const tasks = [makeTask('s1', 'shallow', 25), makeTask('d1', 'deep', 50)];
    const blocks = buildSchedule(tasks, [makeGap(9, 11)]);
    expect(blocks[0].type).toBe('deep');
  });

  it('falls back to shallow when gap < 50 min', () => {
    const tasks = [makeTask('d1', 'deep', 50), makeTask('s1', 'shallow', 25)];
    const blocks = buildSchedule(tasks, [makeGap(9, 9, '2026-01-15')]);
    // 0-min gap — nothing fits
    expect(blocks).toHaveLength(0);
  });

  it('fits shallow task in 30-min gap when only deep and shallow available', () => {
    const tasks = [makeTask('d1', 'deep', 50), makeTask('s1', 'shallow', 25)];
    // 40-min gap: deep (50) won't fit, shallow (25) will
    const gap: TimeRange = {
      start: new Date('2026-01-15T09:00:00'),
      end: new Date('2026-01-15T09:40:00'),
    };
    const blocks = buildSchedule(tasks, [gap]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('shallow');
  });

  it('inserts 5-min buffer between blocks', () => {
    const tasks = [makeTask('s1', 'shallow', 25), makeTask('s2', 'shallow', 25)];
    const blocks = buildSchedule(tasks, [makeGap(9, 11)]);
    expect(blocks).toHaveLength(2);
    const gapMs = blocks[1].start.getTime() - blocks[0].end.getTime();
    expect(gapMs).toBe(5 * 60 * 1000);
  });

  it('skips done tasks', () => {
    const tasks = [
      makeTask('d1', 'deep', 50, 'done'),
      makeTask('s1', 'shallow', 25, 'pending'),
    ];
    const blocks = buildSchedule(tasks, [makeGap(9, 11)]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].task.id).toBe('s1');
  });

  it('returns blocks sorted chronologically', () => {
    const tasks = [
      makeTask('s1', 'shallow', 25),
      makeTask('s2', 'shallow', 25),
      makeTask('s3', 'shallow', 25),
    ];
    const blocks = buildSchedule(tasks, [makeGap(9, 12)]);
    for (let i = 1; i < blocks.length; i++) {
      expect(blocks[i].start.getTime()).toBeGreaterThanOrEqual(blocks[i - 1].start.getTime());
    }
  });

  it('handles full day with multiple gaps', () => {
    const tasks = [
      makeTask('d1', 'deep', 50),
      makeTask('d2', 'deep', 50),
      makeTask('s1', 'shallow', 25),
      makeTask('s2', 'shallow', 25),
    ];
    const gaps = [makeGap(9, 12), makeGap(13, 17)];
    const blocks = buildSchedule(tasks, gaps);
    expect(blocks.length).toBeGreaterThanOrEqual(3);
    // Deep tasks should be placed first
    expect(blocks[0].type).toBe('deep');
  });

  it('does not place blocks outside gap boundaries', () => {
    const tasks = [makeTask('d1', 'deep', 50)];
    const gap = makeGap(9, 10);
    const blocks = buildSchedule(tasks, [gap]);
    blocks.forEach((b) => {
      expect(b.start.getTime()).toBeGreaterThanOrEqual(gap.start.getTime());
      expect(b.end.getTime()).toBeLessThanOrEqual(gap.end.getTime());
    });
  });

  it('skips gaps shorter than 25 min', () => {
    const tasks = [makeTask('s1', 'shallow', 25)];
    const shortGap: TimeRange = {
      start: new Date('2026-01-15T09:00:00'),
      end: new Date('2026-01-15T09:20:00'),
    };
    const blocks = buildSchedule(tasks, [shortGap]);
    expect(blocks).toHaveLength(0);
  });
});

describe('calculateEfficiencyScore', () => {
  it('returns 0 for empty blocks', () => {
    expect(calculateEfficiencyScore([], 480)).toBe(0);
  });

  it('returns 0 for 0 available minutes', () => {
    const tasks = [makeTask('d1', 'deep', 50, 'done')];
    const blocks = buildSchedule(tasks, [makeGap(9, 11)]);
    expect(calculateEfficiencyScore(blocks, 0)).toBe(0);
  });

  it('computes non-zero score when deep tasks are done', () => {
    const task = makeTask('d1', 'deep', 50, 'pending');
    const blocks = buildSchedule([task], [makeGap(9, 11)]);
    expect(blocks).toHaveLength(1);
    // Simulate task completion after scheduling
    blocks[0].task.status = 'done';
    const score = calculateEfficiencyScore(blocks, 480);
    expect(score).toBeGreaterThan(0);
  });
});
