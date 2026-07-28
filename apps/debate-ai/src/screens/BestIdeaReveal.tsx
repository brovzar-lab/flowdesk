import { useDebateStore } from '../store/debateStore';
import { DemoBadge } from '../components/DemoBadge';
import { BRAINSTORM_SUBJECTS } from '../data/subjects';

export function BestIdeaReveal() {
  const result = useDebateStore((s) => s.bestIdeaResult);
  const config = useDebateStore((s) => s.config);
  const reset = useDebateStore((s) => s.reset);

  const subjectOption = BRAINSTORM_SUBJECTS.find((s) => s.id === config.subject);

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 text-sm animate-pulse">Crowning the best idea…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DemoBadge />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-2xl mx-auto w-full">
        {/* Lead badge */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-bold text-black select-none">
            ✦
          </div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            Lead's Call
          </span>
        </div>

        {/* Topic context */}
        {config.topic && (
          <p className="text-slate-500 text-xs text-center mb-2">
            {subjectOption ? `${subjectOption.emoji} ${subjectOption.label} · ` : ''}
            {config.topic}
          </p>
        )}

        {/* Winning idea */}
        <div
          className="w-full rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-amber-500/5 px-8 py-7 mb-6 text-center"
          data-testid="best-idea-winner"
        >
          <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3">
            Best Idea
          </p>
          <p className="text-xl font-semibold text-white leading-snug">{result.winningIdea}</p>
        </div>

        {/* Rationale */}
        <div className="w-full mb-6" data-testid="best-idea-rationale">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Why this idea wins
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{result.rationale}</p>
        </div>

        {/* Runner-ups */}
        {result.runnerUps.length > 0 && (
          <div className="w-full mb-10" data-testid="best-idea-runnerups">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Also worth exploring
            </p>
            <ul className="space-y-2">
              {result.runnerUps.map((idea, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-slate-400 leading-snug"
                >
                  <span className="text-slate-600 shrink-0 mt-0.5">{i + 1}.</span>
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={reset}
          className="text-sm font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-8 py-3 rounded-xl transition-all duration-150 hover:bg-slate-800"
        >
          New Brainstorm
        </button>
      </main>
    </div>
  );
}
