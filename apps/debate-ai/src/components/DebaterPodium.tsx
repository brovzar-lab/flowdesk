import { useState } from 'react';
import type { Side } from '../types';
import { useDebateStore } from '../store/debateStore';
import { MODELS } from '../data/models';

interface Props {
  side: Side;
}

export function DebaterPodium({ side }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);

  const debater = useDebateStore((s) =>
    side === 'left' ? s.config.leftDebater : s.config.rightDebater
  );
  const assignDebater = useDebateStore((s) => s.assignDebater);
  const removeDebater = useDebateStore((s) => s.removeDebater);
  const setPersonaName = useDebateStore((s) => s.setPersonaName);
  const setStance = useDebateStore((s) => s.setStance);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const modelId = e.dataTransfer.getData('modelId');
    const model = MODELS.find((m) => m.id === modelId);
    if (model) assignDebater(side, model);
  }

  const label = side === 'left' ? 'Left' : 'Right';

  const borderStyle = debater
    ? { borderColor: `${debater.model.color}50`, backgroundColor: `${debater.model.color}0D` }
    : {};

  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </span>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid={`podium-${side}`}
        className={`w-full min-h-40 rounded-2xl border-2 border-dashed transition-all duration-150 flex flex-col p-4 ${
          isDragOver
            ? 'border-white/60 bg-white/5 scale-[1.02]'
            : debater
              ? 'border-solid'
              : 'border-slate-700/60 bg-slate-900/40'
        }`}
        style={debater ? borderStyle : undefined}
      >
        {debater ? (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ backgroundColor: debater.model.color }}
                >
                  {debater.model.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{debater.model.name}</p>
                  <p className="text-xs text-slate-400 truncate">{debater.model.provider}</p>
                </div>
              </div>
              <button
                onClick={() => removeDebater(side)}
                className="text-slate-600 hover:text-slate-300 text-xl leading-none transition-colors shrink-0 w-6 h-6 flex items-center justify-center"
                aria-label={`Remove ${debater.model.name} from ${label} podium`}
              >
                &times;
              </button>
            </div>
            <input
              type="text"
              placeholder="Persona name (optional)"
              value={debater.personaName}
              onChange={(e) => setPersonaName(side, e.target.value)}
              className="w-full bg-black/30 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 border border-slate-700/60 focus:outline-none focus:border-slate-500"
            />
            <input
              type="text"
              placeholder='Stance (e.g. "For", "Against")'
              value={debater.stance}
              onChange={(e) => setStance(side, e.target.value)}
              className="w-full bg-black/30 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 border border-slate-700/60 focus:outline-none focus:border-slate-500"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
              <span className="text-slate-600 text-lg font-light">+</span>
            </div>
            <p className="text-sm text-slate-600">
              {isDragOver ? 'Drop to assign' : 'Drag a model here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
