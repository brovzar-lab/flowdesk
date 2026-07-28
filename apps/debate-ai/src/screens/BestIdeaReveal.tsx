import { useDebateStore } from '../store/debateStore';
import { DemoBadge } from '../components/DemoBadge';
import { BRAINSTORM_SUBJECTS } from '../data/subjects';

export function BestIdeaReveal() {
  const result = useDebateStore((s) => s.bestIdeaResult);
  const config = useDebateStore((s) => s.config);
  const turns = useDebateStore((s) => s.turns);
  const reset = useDebateStore((s) => s.reset);

  const subjectOption = BRAINSTORM_SUBJECTS.find((s) => s.id === config.subject);
  const leftName = config.leftDebater?.personaName || 'Agent A';
  const rightName = config.rightDebater?.personaName || 'Agent B';
  const ideaCount = turns.filter((t) => t.side !== 'lead').length;

  if (!result) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">Crowning the best idea…</p>
      </div>
    );
  }

  const runnerUpGridClass =
    result.runnerUps.length === 3 ? 'grid grid-cols-3 gap-3' : 'grid grid-cols-2 gap-3';

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <DemoBadge />

      <main className="flex-1 flex flex-col items-center px-6 py-12 max-w-2xl mx-auto w-full">
        {/* Icon + headline */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💡</div>
          <h1 className="text-3xl font-bold text-gray-900">Best Idea</h1>
          {ideaCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">From {ideaCount} ideas explored</p>
          )}
          {subjectOption && (
            <p className="text-xs text-gray-400 mt-1">
              {subjectOption.emoji} {subjectOption.label} · {config.topic}
            </p>
          )}
        </div>

        {/* Hero card */}
        <div
          className="w-full bg-white border border-amber-300 rounded-2xl p-6 shadow-sm mb-6"
          data-testid="best-idea-winner"
        >
          <h2 className="text-2xl font-bold text-gray-900">{result.winningIdea}</h2>
          {result.pitch && (
            <p className="text-base text-gray-600 mt-1">{result.pitch}</p>
          )}
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-4 mb-1">
            Why this idea
          </p>
          <p className="text-sm text-gray-600 leading-relaxed italic" data-testid="best-idea-rationale">
            {result.rationale}
          </p>
        </div>

        {/* Runner-ups */}
        {result.runnerUps.length > 0 && (
          <div className="w-full mb-8" data-testid="best-idea-runnerups">
            <p className="text-sm font-semibold text-gray-700 mb-3">Also worth developing</p>
            <div className={runnerUpGridClass}>
              {result.runnerUps.map((ru, i) => (
                <div
                  key={i}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4"
                >
                  <p className="text-sm font-semibold text-gray-800">{ru.title}</p>
                  {ru.pitch && (
                    <p className="text-xs text-gray-500 mt-0.5">{ru.pitch}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credit line */}
        <p className="text-xs text-gray-400 text-center mb-8">
          Brainstormed by <strong>{leftName}</strong> · <strong>{rightName}</strong> — Evaluated by Lead
        </p>

        <button
          onClick={reset}
          className="text-sm font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-8 py-3 rounded-xl transition-all duration-150 hover:bg-gray-50"
        >
          New Brainstorm
        </button>
      </main>
    </div>
  );
}
