import { useEffect } from 'react';
import { useDebateStore } from '../store/debateStore';
import { useSettingsStore } from '../store/settingsStore';
import { runBrainstormDemo } from '../lib/useDemoEngine';
import { DemoBadge } from '../components/DemoBadge';
import type { Turn } from '../types';

function LeadTurn({ turn }: { turn: Turn }) {
  return (
    <div className="flex justify-center my-6" data-testid="lead-turn">
      <div className="max-w-2xl w-full">
        <div className="flex items-center gap-2 mb-2 justify-center">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-black select-none">
            ✦
          </div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Lead</span>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 text-slate-200 text-sm leading-relaxed text-center">
          {turn.status === 'streaming' ? (
            <>
              {turn.text}
              <span className="inline-block w-1.5 h-4 bg-amber-400/70 ml-1 animate-pulse align-middle" />
            </>
          ) : (
            turn.text
          )}
        </div>
      </div>
    </div>
  );
}

function DebaterTurn({ turn, leftName, rightName }: { turn: Turn; leftName: string; rightName: string }) {
  const isLeft = turn.side === 'left';
  const name = isLeft ? leftName : rightName;

  return (
    <div
      className={`flex ${isLeft ? 'justify-start' : 'justify-end'} mb-4`}
      data-testid={`turn-${turn.side}`}
    >
      <div className="max-w-xl">
        <p className={`text-xs font-semibold mb-1.5 ${isLeft ? 'text-left text-slate-400' : 'text-right text-slate-400'}`}>
          {name}
        </p>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isLeft
              ? 'bg-slate-800 text-slate-100 rounded-tl-sm'
              : 'bg-slate-700 text-slate-100 rounded-tr-sm'
          }`}
        >
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

  useEffect(() => {
    if (isDemoMode && config.format === 'brainstorm' && turns.length === 0) {
      runBrainstormDemo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leftName = config.leftDebater?.personaName || 'Left';
  const rightName = config.rightDebater?.personaName || 'Right';
  const isBrainstorm = config.format === 'brainstorm';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DemoBadge />

      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 shrink-0">
        <div>
          <h1 className="text-base font-bold text-white truncate max-w-md">{config.topic}</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            {isBrainstorm ? 'Brainstorm session' : 'Debate in progress'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {phase === 'debating' && (
            <button
              onClick={pauseDebate}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Pause
            </button>
          )}
          {phase === 'paused' && (
            <button
              onClick={resumeDebate}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Resume
            </button>
          )}
          {(phase === 'debating' || phase === 'paused') && (
            <button
              onClick={concludeDebate}
              className="text-xs font-semibold text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              {isBrainstorm ? 'Get Best Idea' : 'Conclude'}
            </button>
          )}
          <button
            onClick={reset}
            className="text-xs text-slate-500 hover:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Reset
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl mx-auto w-full">
        {turns.length === 0 && (
          <div className="flex items-center justify-center h-40">
            <p className="text-slate-600 text-sm">
              {phase === 'concluding' ? 'Generating result…' : 'Waiting for first turn…'}
            </p>
          </div>
        )}
        {turns.map((turn) =>
          turn.side === 'lead' ? (
            <LeadTurn key={turn.id} turn={turn} />
          ) : (
            <DebaterTurn key={turn.id} turn={turn} leftName={leftName} rightName={rightName} />
          )
        )}
        {phase === 'concluding' && turns.length > 0 && (
          <div className="flex justify-center mt-4">
            <p className="text-slate-500 text-xs animate-pulse">
              {isBrainstorm ? 'Lead is crowning the best idea…' : 'Concluding…'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
