import type { Model } from '../types';

interface Props {
  model: Model;
  assigned?: boolean;
}

export function ModelCard({ model, assigned = false }: Props) {
  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('modelId', model.id);
    e.dataTransfer.effectAllowed = 'copy';
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      data-testid={`model-card-${model.id}`}
      role="listitem"
      aria-label={`${model.name} by ${model.provider}`}
      className={`relative cursor-grab active:cursor-grabbing rounded-xl p-3 border transition-all duration-150 select-none ${
        assigned
          ? 'opacity-40 pointer-events-none'
          : 'hover:scale-105 hover:shadow-lg hover:shadow-black/40'
      }`}
      style={{
        borderColor: `${model.color}55`,
        backgroundColor: `${model.color}12`,
      }}
    >
      <div
        className="w-8 h-8 rounded-full mb-2 flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ backgroundColor: model.color }}
      >
        {model.name.charAt(0)}
      </div>
      <p className="text-xs font-semibold text-slate-100 leading-tight truncate">{model.name}</p>
      <p className="text-xs text-slate-500 mt-0.5 truncate">{model.provider}</p>
    </div>
  );
}
