import { useEffect } from 'react';
import { useDebateStore } from '../store/debateStore';
import { useSettingsStore } from '../store/settingsStore';
import { MODELS } from '../data/models';

const DEMO_LEFT = MODELS.find((m) => m.id === 'gpt-4o')!;
const DEMO_RIGHT = MODELS.find((m) => m.id === 'claude-3.5-sonnet')!;

/**
 * In demo mode, pre-populates both podiums and selects the Heated Argument
 * format (non-classic) so the format switcher and voice pickers are immediately
 * visible on the live Vercel URL without any setup.
 * Runs once on mount — does nothing when an OpenRouter key is present.
 */
export function useDemoEngine() {
  const isDemoMode = useSettingsStore((s) => s.isDemoMode);

  useEffect(() => {
    if (!isDemoMode) return;
    const { assignDebater, setPersonaName, setStance, setFormat } = useDebateStore.getState();
    assignDebater('left', DEMO_LEFT);
    setPersonaName('left', 'GPT-4o');
    setStance('left', 'For');
    assignDebater('right', DEMO_RIGHT);
    setPersonaName('right', 'Claude 3.5 Sonnet');
    setStance('right', 'Against');
    // Select a non-default format so the switcher is demonstrably functional
    setFormat('heated');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
