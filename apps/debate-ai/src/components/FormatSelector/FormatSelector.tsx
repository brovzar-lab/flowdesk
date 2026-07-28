import type { DebateFormatId } from '../../types';
import { DEBATE_FORMATS } from '../../data/formats';

interface Props {
  selectedFormat: DebateFormatId;
  onSelect: (format: DebateFormatId) => void;
}

export function FormatSelector({ selectedFormat, onSelect }: Props) {
  return (
    <section>
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
        Debate Format
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {DEBATE_FORMATS.map((format) => {
          const isSelected = format.id === selectedFormat;
          return (
            <button
              key={format.id}
              onClick={() => onSelect(format.id)}
              data-testid={`format-card-${format.id}`}
              aria-pressed={isSelected}
              className={`text-left rounded-xl border p-3 transition-all duration-150 ${
                isSelected
                  ? 'border-white bg-white/10 ring-1 ring-white/30'
                  : 'border-slate-700/60 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-900'
              }`}
            >
              <div className="text-xl mb-1.5">{format.emoji}</div>
              <div className="text-sm font-semibold text-white mb-1">{format.label}</div>
              <div className="text-xs text-slate-400 leading-snug">{format.blurb}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
