import { useEffect } from 'react';
import { useStore } from '../lib/store';
import { useAuthStore } from '../lib/auth';
import { formatBlockTime } from '../demo/seed';
import { TYPE_BLOCK_BG, TYPE_LABELS } from '../lib/types';
import { isDemoMode } from '../lib/config';

const HOUR_START = 8;
const HOUR_END = 18;
const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60;
const TIMELINE_HEIGHT_PX = 480;

function minutesFromStart(hour: number, min: number): number {
  return (hour - HOUR_START) * 60 + min;
}

function hourLabel(h: number): string {
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

export default function ScheduleTimeline() {
  const { schedule, efficiencyScore, enterCockpit, runAiScheduler, isPlanningLoading, planningRationale, clearRationale } = useStore((s) => ({
    schedule: s.schedule,
    efficiencyScore: s.efficiencyScore,
    enterCockpit: s.enterCockpit,
    runAiScheduler: s.runAiScheduler,
    isPlanningLoading: s.isPlanningLoading,
    planningRationale: s.planningRationale,
    clearRationale: s.clearRationale,
  }));

  const { user, accessToken } = useAuthStore((s) => ({
    user: s.user,
    accessToken: s.accessToken,
  }));

  // Auto-dismiss rationale after 8s
  useEffect(() => {
    if (!planningRationale) return;
    const t = setTimeout(clearRationale, 8000);
    return () => clearTimeout(t);
  }, [planningRationale, clearRationale]);

  const handlePlanMyDay = () => {
    if (isPlanningLoading) return;
    runAiScheduler(isDemoMode ? null : (accessToken ?? null), isDemoMode ? null : (user?.uid ?? null));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Rationale banner */}
      {planningRationale && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-teal-900/40 border border-teal-700/50 text-teal-300 text-xs flex items-start gap-2">
          <span className="flex-shrink-0 mt-0.5">✦</span>
          <span className="flex-1">{planningRationale}</span>
          <button
            onClick={clearRationale}
            className="flex-shrink-0 text-teal-600 hover:text-teal-400 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700/60">
        <div>
          <h2 className="text-sm font-bold text-slate-100 tracking-wide uppercase">Today</h2>
          <p className="text-xs text-slate-500 mt-0.5">Tap a block to focus</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlanMyDay}
            disabled={isPlanningLoading}
            className="px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-600/40 text-teal-400 text-xs font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isPlanningLoading ? (
              <>
                <span className="animate-spin inline-block">⟳</span>
                <span>Planning…</span>
              </>
            ) : (
              <>
                <span>⟳</span>
                <span>{isDemoMode ? 'Schedule' : 'Plan My Day'}</span>
              </>
            )}
          </button>
          <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 rounded-full px-3 py-1.5">
            <span className="text-teal-400 text-xs font-bold">{efficiencyScore}%</span>
            <span className="text-slate-500 text-xs">flow</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="relative" style={{ height: `${TIMELINE_HEIGHT_PX}px` }}>
          {/* Hour gridlines */}
          {Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => {
            const hour = HOUR_START + i;
            const pct = (i / (HOUR_END - HOUR_START)) * 100;
            return (
              <div
                key={hour}
                className="absolute w-full flex items-start"
                style={{ top: `${pct}%` }}
              >
                <span className="text-slate-600 text-xs w-12 flex-shrink-0 -mt-2.5">
                  {hourLabel(hour)}
                </span>
                <div className="flex-1 border-t border-slate-800 ml-1" />
              </div>
            );
          })}

          {/* Schedule blocks */}
          {schedule.map((block) => {
            const offsetMin = minutesFromStart(block.startHour, block.startMin);
            const topPct = (offsetMin / TOTAL_MINUTES) * 100;
            const heightPct = (block.durationMin / TOTAL_MINUTES) * 100;

            return (
              <button
                key={block.id}
                onClick={() => enterCockpit(block.taskId)}
                className={`absolute left-14 right-0 rounded-lg border px-3 py-1.5 text-left transition-all hover:brightness-125 hover:shadow-lg group ${TYPE_BLOCK_BG[block.type]}`}
                style={{ top: `${topPct}%`, height: `${Math.max(heightPct, 4)}%` }}
              >
                <p className="text-xs font-semibold text-slate-100 truncate group-hover:text-white">
                  {block.title}
                </p>
                <p className="text-xs text-slate-400 truncate">{formatBlockTime(block)}</p>
                <span className="text-xs text-slate-500">{TYPE_LABELS[block.type]}</span>
              </button>
            );
          })}

          {schedule.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-slate-600 text-sm text-center">
                No schedule yet.
                <br />
                Add tasks and tap{' '}
                {isDemoMode ? '⟳ Schedule' : '⟳ Plan My Day'}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
