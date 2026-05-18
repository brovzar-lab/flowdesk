import { useEffect } from 'react';
import { useStore } from '../lib/store';
import { COCKPIT_DURATION_SEC } from '../lib/config';
import BlockingBanner from '../components/BlockingBanner';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CockpitScreen() {
  const {
    activeTaskId,
    cockpitSecondsLeft,
    cockpitRunning,
    tasks,
    exitCockpit,
    tickTimer,
    startTimer,
    pauseTimer,
  } = useStore((s) => ({
    activeTaskId: s.activeTaskId,
    cockpitSecondsLeft: s.cockpitSecondsLeft,
    cockpitRunning: s.cockpitRunning,
    tasks: s.tasks,
    exitCockpit: s.exitCockpit,
    tickTimer: s.tickTimer,
    startTimer: s.startTimer,
    pauseTimer: s.pauseTimer,
  }));

  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const progressPct = ((COCKPIT_DURATION_SEC - cockpitSecondsLeft) / COCKPIT_DURATION_SEC) * 100;
  const done = cockpitSecondsLeft <= 0;

  useEffect(() => {
    if (!cockpitRunning) return;
    const interval = setInterval(tickTimer, 1000);
    return () => clearInterval(interval);
  }, [cockpitRunning, tickTimer]);

  return (
    <div className="fixed inset-0 bg-navy-900 flex flex-col items-center justify-center z-40">
      {/* Exit */}
      <button
        onClick={exitCockpit}
        className="absolute top-5 left-5 text-slate-600 hover:text-slate-300 text-sm font-medium transition-colors"
      >
        ← Back
      </button>

      {/* Cockpit label */}
      <p className="text-xs text-teal-500 font-bold tracking-widest uppercase mb-8">
        Cockpit Mode
      </p>

      {/* Task title */}
      <h1 className="text-3xl font-extrabold text-slate-100 text-center max-w-xs leading-tight mb-2">
        {activeTask?.title ?? 'Focus Session'}
      </h1>
      <p className="text-slate-500 text-sm mb-12">25-minute deep work sprint</p>

      {/* Timer ring */}
      <div className="relative w-48 h-48 flex items-center justify-center mb-10">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#1E293B"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={done ? '#22C55E' : '#14B8A6'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - progressPct / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        <span className="text-5xl font-mono font-bold text-slate-100 tabular-nums">
          {done ? '✓' : formatTime(cockpitSecondsLeft)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1.5 bg-slate-800 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-teal-500 rounded-full transition-all duration-1000"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Controls */}
      {!done ? (
        <button
          onClick={cockpitRunning ? pauseTimer : startTimer}
          className="w-40 py-3.5 rounded-2xl font-bold text-sm transition-colors bg-teal-500 hover:bg-teal-400 text-slate-900"
        >
          {cockpitRunning ? '⏸ Pause' : '▶ Start'}
        </button>
      ) : (
        <button
          onClick={exitCockpit}
          className="w-40 py-3.5 rounded-2xl font-bold text-sm bg-green-500 hover:bg-green-400 text-slate-900 transition-colors"
        >
          Done — Next Task
        </button>
      )}

      <BlockingBanner />
    </div>
  );
}
