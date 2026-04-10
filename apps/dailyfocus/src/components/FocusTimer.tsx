'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const FOCUS_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

type Phase = 'idle' | 'focusing' | 'break' | 'done';

type Props = {
  taskTitle: string;
  onSessionEnd: (durationSeconds: number) => void;
  onCancel: () => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function FocusTimer({ taskTitle, onSessionEnd, onCancel }: Props): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_DURATION);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopTimer = useCallback((): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startFocus = useCallback((): void => {
    startTimeRef.current = Date.now();
    setPhase('focusing');
    setSecondsLeft(FOCUS_DURATION);
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          setPhase('break');
          setElapsed(FOCUS_DURATION);
          // Trigger session end callback
          return 0;
        }
        const e = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(e);
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  // On focus phase completion
  useEffect(() => {
    if (phase === 'break' && elapsed > 0) {
      onSessionEnd(elapsed);
      // Auto-start break timer
      setSecondsLeft(BREAK_DURATION);
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            stopTimer();
            setPhase('done');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const circumference = 2 * Math.PI * 54; // radius = 54
  const totalDuration = phase === 'break' || phase === 'done' ? BREAK_DURATION : FOCUS_DURATION;
  const progress = phase === 'idle' ? 0 : 1 - secondsLeft / totalDuration;
  const strokeDashoffset = circumference * (1 - progress);

  const phaseColor = phase === 'break' ? '#10b981' : '#0ea5e9'; // green for break, blue for focus

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Task name */}
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
          {phase === 'idle' ? 'Ready to focus on' : phase === 'break' ? 'Break time!' : phase === 'done' ? 'Session complete!' : 'Focusing on'}
        </p>
        <p className="text-lg font-semibold text-slate-900 max-w-xs text-center leading-snug">
          {taskTitle}
        </p>
      </div>

      {/* Circular timer */}
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={phaseColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        {/* Timer text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-slate-900 tabular-nums">
            {formatTime(secondsLeft)}
          </span>
          <span className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wide">
            {phase === 'break' ? 'break' : phase === 'done' ? 'done' : 'focus'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        {phase === 'idle' && (
          <>
            <button onClick={startFocus} className="w-full btn-primary text-lg py-4">
              Start 25-min focus
            </button>
            <button onClick={onCancel} className="btn-ghost text-sm">
              Cancel
            </button>
          </>
        )}

        {phase === 'focusing' && (
          <button
            onClick={() => {
              stopTimer();
              const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
              onSessionEnd(elapsed);
              setPhase('done');
            }}
            className="w-full py-3 rounded-xl border-2 border-red-200 text-red-500
                       font-medium hover:bg-red-50 transition-colors"
          >
            End session early
          </button>
        )}

        {phase === 'break' && (
          <p className="text-sm text-slate-400 text-center">
            Take a short break. You earned it! ☕️
          </p>
        )}

        {phase === 'done' && (
          <>
            <button onClick={startFocus} className="w-full btn-primary">
              Start another session
            </button>
            <button onClick={onCancel} className="btn-ghost text-sm">
              Back to tasks
            </button>
          </>
        )}
      </div>
    </div>
  );
}
