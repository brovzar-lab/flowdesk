import { useState } from 'react';
import toast from 'react-hot-toast';
import type { Side } from '../../types';
import { AVAILABLE_VOICES } from '../../data/voices';
import { useDebateStore } from '../../store/debateStore';
import { useSettingsStore } from '../../store/settingsStore';

interface Props {
  side: Side;
}

const PREVIEW_TEXT = "And that is exactly where you're wrong.";

export function VoicePicker({ side }: Props) {
  const [isPreviewing, setIsPreviewing] = useState(false);

  const isDemoMode = useSettingsStore((s) => s.isDemoMode);
  const voiceId = useDebateStore(
    (s) =>
      (side === 'left' ? s.config.leftDebater : s.config.rightDebater)?.voiceId ??
      AVAILABLE_VOICES[0].id,
  );
  const setVoiceId = useDebateStore((s) => s.setVoiceId);

  async function handlePreview() {
    if (isPreviewing) return;
    setIsPreviewing(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId, text: PREVIEW_TEXT }),
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setIsPreviewing(false);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setIsPreviewing(false);
      };
      await audio.play();
    } catch {
      if (isDemoMode) {
        toast('Demo mode — voice preview plays on the live deployment', { icon: 'ℹ️' });
      } else {
        toast.error('Voice preview unavailable');
      }
      setIsPreviewing(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Voice</span>
      <div className="flex gap-2">
        <select
          value={voiceId}
          onChange={(e) => setVoiceId(side, e.target.value)}
          data-testid={`voice-select-${side}`}
          className="flex-1 bg-black/30 rounded-lg px-3 py-2 text-xs text-white border border-slate-700/60 focus:outline-none focus:border-slate-500 cursor-pointer"
          aria-label={`${side === 'left' ? 'Left' : 'Right'} debater voice`}
        >
          {AVAILABLE_VOICES.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} — {v.description}
            </option>
          ))}
        </select>
        <button
          onClick={handlePreview}
          disabled={isPreviewing}
          aria-label="Preview voice"
          title="Hear a preview of this voice"
          data-testid={`voice-preview-${side}`}
          className="px-3 py-2 rounded-lg border border-slate-700/60 bg-black/20 text-slate-300 hover:text-white hover:border-slate-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          {isPreviewing ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  );
}
