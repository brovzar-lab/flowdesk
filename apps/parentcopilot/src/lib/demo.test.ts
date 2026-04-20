import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('demo mode detection', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('activates when VITE_FIREBASE_API_KEY is placeholder', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'REPLACE_WITH_VALUE');
    const { isDemoMode } = await import('./demo');
    expect(isDemoMode).toBe(true);
  });

  it('activates when VITE_FIREBASE_API_KEY is absent', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    const { isDemoMode } = await import('./demo');
    expect(isDemoMode).toBe(true);
  });
});
