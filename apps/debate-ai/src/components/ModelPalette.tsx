import { MODELS } from '../data/models';
import { useDebateStore } from '../store/debateStore';
import { ModelCard } from './ModelCard';

export function ModelPalette() {
  const leftDebater = useDebateStore((s) => s.config.leftDebater);
  const rightDebater = useDebateStore((s) => s.config.rightDebater);

  const assignedIds = new Set(
    [leftDebater?.model.id, rightDebater?.model.id].filter((id): id is string => Boolean(id))
  );

  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Model Palette — drag onto a podium
      </h3>
      <div role="list" className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {MODELS.map((model) => (
          <ModelCard key={model.id} model={model} assigned={assignedIds.has(model.id)} />
        ))}
      </div>
    </div>
  );
}
