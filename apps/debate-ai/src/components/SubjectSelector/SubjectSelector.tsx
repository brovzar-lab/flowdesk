import type { BrainstormSubject } from '../../types';
import { BRAINSTORM_SUBJECTS } from '../../data/subjects';

interface Props {
  selected: BrainstormSubject | undefined;
  onSelect: (subject: BrainstormSubject) => void;
}

export function SubjectSelector({ selected, onSelect }: Props) {
  const active = selected ?? 'general';

  return (
    <div
      className="animate-subject-reveal"
      data-testid="subject-selector"
      style={{ animation: 'subjectReveal 150ms ease-out both' }}
    >
      <style>{`
        @keyframes subjectReveal {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
      <div className="flex flex-wrap gap-2">
        {BRAINSTORM_SUBJECTS.map((s) => {
          const isSelected = s.id === active;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              data-testid={`subject-${s.id}`}
              aria-pressed={isSelected}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-150 ${
                isSelected
                  ? 'bg-amber-500 text-white border border-amber-500 font-medium'
                  : 'border border-slate-600 text-slate-400 hover:border-amber-400 hover:text-amber-400'
              }`}
            >
              <span>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
