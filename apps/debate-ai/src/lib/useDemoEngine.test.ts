import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDemoEngine } from './useDemoEngine';
import { useDebateStore } from '../store/debateStore';
import { useSettingsStore } from '../store/settingsStore';

describe('useDemoEngine', () => {
  beforeEach(() => {
    useDebateStore.getState().reset();
  });

  it('pre-fills both podiums in demo mode', () => {
    useSettingsStore.setState({ isDemoMode: true });
    renderHook(() => useDemoEngine());
    const { leftDebater, rightDebater } = useDebateStore.getState().config;
    expect(leftDebater).not.toBeNull();
    expect(rightDebater).not.toBeNull();
  });

  it('selects a non-classic format in demo mode to showcase the switcher', () => {
    useSettingsStore.setState({ isDemoMode: true });
    renderHook(() => useDemoEngine());
    expect(useDebateStore.getState().config.format).not.toBe('classic');
  });

  it('assigns stances to both demo debaters', () => {
    useSettingsStore.setState({ isDemoMode: true });
    renderHook(() => useDemoEngine());
    const { leftDebater, rightDebater } = useDebateStore.getState().config;
    expect(leftDebater?.stance).toBeTruthy();
    expect(rightDebater?.stance).toBeTruthy();
  });

  it('does not modify the store when an API key is present (non-demo mode)', () => {
    useSettingsStore.setState({ isDemoMode: false });
    renderHook(() => useDemoEngine());
    const { leftDebater, rightDebater } = useDebateStore.getState().config;
    expect(leftDebater).toBeNull();
    expect(rightDebater).toBeNull();
  });
});
