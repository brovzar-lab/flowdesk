import { useSettingsStore } from '../store/settingsStore';

export function DemoBadge() {
  const isDemoMode = useSettingsStore((s) => s.isDemoMode);
  if (!isDemoMode) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg select-none">
      Demo Mode
    </div>
  );
}
