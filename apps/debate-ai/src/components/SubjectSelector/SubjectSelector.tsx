import type { BrainstormSubject } from '../../types';
import { BRAINSTORM_SUBJECTS } from '../../data/subjects';

interface Props {
  selected: BrainstormSubject | undefined;
  onSelect: (subject: BrainstormSubject) => void;
}

export function SubjectSelector({ selected, onSelect }: Props) {
  return (
    <div
      className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
      data-testid="subject-selector"
    >
      <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-3">
        Subject / Domain
      </p>
      <div className="flex flex-wrap gap-2">
        {BRAINSTORM_SUBJECTS.map((s) => {
          const isSelected = s.id === selected;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              data-testid={`subject-${s.id}`}
              aria-pressed={isSelected}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isSelected
                  ? 'bg-amber-500 text-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
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
