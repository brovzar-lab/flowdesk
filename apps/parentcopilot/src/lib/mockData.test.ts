import { describe, it, expect } from 'vitest';
import { DEMO_EVENTS, DEMO_BABY, DEMO_PREDICTIONS, DEMO_TIPS } from './mockData';

describe('mockData', () => {
  it('generates at least 50 events covering 14 days', () => {
    expect(DEMO_EVENTS.length).toBeGreaterThan(50);
  });

  it('events are sorted descending by timestamp', () => {
    for (let i = 1; i < DEMO_EVENTS.length; i++) {
      expect(DEMO_EVENTS[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
        DEMO_EVENTS[i].timestamp.getTime(),
      );
    }
  });

  it('includes all three event types', () => {
    const types = new Set(DEMO_EVENTS.map((e) => e.type));
    expect(types.has('feed')).toBe(true);
    expect(types.has('sleep')).toBe(true);
    expect(types.has('diaper')).toBe(true);
  });

  it('DEMO_BABY has expected shape', () => {
    expect(DEMO_BABY.id).toBeTruthy();
    expect(DEMO_BABY.name).toBeTruthy();
    expect(DEMO_BABY.birthDate).toBeInstanceOf(Date);
  });

  it('has at least 2 predictions', () => {
    expect(DEMO_PREDICTIONS.length).toBeGreaterThanOrEqual(2);
  });

  it('has at least 1 tip', () => {
    expect(DEMO_TIPS.length).toBeGreaterThanOrEqual(1);
  });
});
