import { useEffect } from 'react';
import { useDebateStore } from '../store/debateStore';
import { useSettingsStore } from '../store/settingsStore';
import { runBrainstormDemo } from '../lib/useDemoEngine';
import { DemoBadge } from '../components/DemoBadge';
import type { Turn } from '../types';

function LeadTurn({ turn }: { turn: Turn }) {
  const isSynthesis = turn.leadType === 'synthesis';

  return (
    <div className="flex justify-center my-6 px-2" data-testid="lead-turn">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm shrink-0 select-none">
            ✦
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-700">
            ✦ Lead
          </span>
          {isSynthesis ? (
            <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-semibold">
              💡 BEST IDEA
            </span>
          ) : (
            <span className="text-xs bg-violet-100 text-violet-600 rounded-full px-2 py-0.5">
              MID-STEER
            </span>
          )}
        </div>

        {/* Bubble */}
        <div
          className={`bg-violet-50 border-l-4 border-violet-500 rounded-r-lg px-5 py-4 text-gray-800 text-sm leading-relaxed ${
            isSynthesis ? 'ring-2 ring-amber-400 shadow-md' : ''
          }`}
        >
          {turn.status === 'streaming' ? (
            <>
              {turn.text}
              <span className="inline-block w-1.5 h-4 bg-violet-400/70 ml-1 animate-pulse align-middle" />
            </>
          ) : (
            turn.text
          )}
        </div>
      </div>
    </div>
  );
}

function DebaterTurn({
  turn,
  leftName,
  rightName,
  isBrainstorm,
}: {
  turn: Turn;
  leftName: string;
  rightName: string;
  isBrainstorm: boolean;
}) {
  const isLeft = turn.side === 'left';
  const name = isLeft ? leftName : rightName;

  const bubbleClass = isBrainstorm
    ? isLeft
      ? 'bg-white border-l-4 border-amber-500 rounded-r-lg text-gray-800'
      : 'bg-white border-l-4 border-orange-400 rounded-r-lg text-gray-800'
    : isLeft
      ? 'bg-slate-800 text-slate-100 rounded-tl-sm'
      : 'bg-slate-700 text-slate-100 rounded-tr-sm';

  return (
    <div
      className={`flex ${isLeft ? 'justify-start' : 'justify-end'} mb-4`}
      data-testid={`turn-${turn.side}`}
    >
      <div className="max-w-xl">
        <p
          className={`text-xs font-semibold mb-1.5 ${
            isLeft ? 'text-left' : 'text-right'
          } ${isBrainstorm ? 'text-gray-500' : 'text-slate-400'}`}
        >
          {name}
        </p>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${bubbleClass}`}>
          {turn.status === 'streaming' ? (
            <>
              {turn.text}
              <span className="inline-block w-1.5 h-4 bg-slate-400/70 ml-1 animate-pulse align-middle" />
            </>
          ) : (
            turn.text
          )}
        </div>
      </div>
    </div>
  );
}

export function ArenaScreen() {
  const phase = useDebateStore((s) => s.phase);
  const turns = useDebateStore((s) => s.turns);
  const config = useDebateStore((s) => s.config);
  const concludeDebate = useDebateStore((s) => s.concludeDebate);
  const pauseDebate = useDebateStore((s) => s.pauseDebate);
  const resumeDebate = useDebateStore((s) => s.resumeDebate);
  const reset = useDebateStore((s) => s.reset);
  const isDemoMode = useSettingsStore((s) => s.isDemoMode);

  const isBrainstorm = config.format === 'brainstorm';
  const leftName = config.leftDebater?.personaName || 'Left';
  const rightName = config.rightDebater?.personaName || 'Right';

  useEffect(() => {
    if (isDemoMode && isBrainstorm && turns.length === 0) {
      runBrainstormDemo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bgClass = isBrainstorm
    ? 'min-h-screen bg-amber-50 text-gray-900 flex flex-col border border-amber-200'
    : 'min-h-screen bg-slate-950 text-slate-100 flex flex-col';

  const headerClass = isBrainstorm
    ? 'flex items-center justify-between px-6 py-4 border-b border-amber-200 shrink-0'
    : 'flex items-center justify-between px-6 py-4 border-b border-slate-800/60 shrink-0';

  return (
    <div className={bgClass}>
      <DemoBadge />

      <header className={headerClass}>
        <div>
          <h1
            className={`text-base font-bold truncate max-w-md ${
              isBrainstorm ? 'text-gray-900' : 'text-white'
            }`}
          >
            {config.topic}
          </h1>
          <p className={`text-xs mt-0.5 ${isBrainstorm ? 'text-gray-400' : 'text-slate-600'}`}>
            {isBrainstorm ? 'Brainstorm session' : 'Debate in progress'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {phase === 'debating' && (
            <button
              onClick={pauseDebate}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                isBrainstorm
                  ? 'text-gray-500 hover:text-gray-900 hover:bg-amber-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Pause
            </button>
          )}
          {phase === 'paused' && (
            <button
              onClick={resumeDebate}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                isBrainstorm
                  ? 'text-gray-500 hover:text-gray-900 hover:bg-amber-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Resume
            </button>
          )}
          {(phase === 'debating' || phase === 'paused') && (
            <button
              onClick={concludeDebate}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                isBrainstorm
                  ? 'text-amber-700 bg-amber-100 hover:bg-amber-200'
                  : 'text-white bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {isBrainstorm ? 'Get Best Idea' : 'Conclude'}
            </button>
          )}
          <button
            onClick={reset}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              isBrainstorm
                ? 'text-gray-400 hover:text-gray-700 hover:bg-amber-100'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            Reset
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl mx-auto w-full">
        {turns.length === 0 && (
          <div className="flex items-center justify-center h-40">
            <p
              className={`text-sm ${isBrainstorm ? 'text-gray-400' : 'text-slate-600'}`}
            >
              {phase === 'concluding' ? 'Generating result…' : 'Waiting for first turn…'}
            </p>
          </div>
        )}
        {turns.map((turn) =>
          turn.side === 'lead' ? (
            <LeadTurn key={turn.id} turn={turn} />
          ) : (
            <DebaterTurn
              key={turn.id}
              turn={turn}
              leftName={leftName}
              rightName={rightName}
              isBrainstorm={isBrainstorm}
            />
          )
        )}
        {phase === 'concluding' && turns.length > 0 && (
          <div className="flex justify-center mt-4">
            {/* Lead loading skeleton */}
            <div className="max-w-2xl w-full">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-violet-200 animate-pulse" />
                <div className="h-3 w-16 bg-violet-100 rounded animate-pulse" />
              </div>
              <div className="bg-violet-50 animate-pulse rounded-r-lg border-l-4 border-violet-300 h-16" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
