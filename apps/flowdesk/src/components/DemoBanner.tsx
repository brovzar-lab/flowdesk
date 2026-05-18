export default function DemoBanner() {
  return (
    <div className="w-full bg-teal-600/20 border-b border-teal-700/40 px-4 py-2 flex items-center justify-center gap-2">
      <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
      <p className="text-teal-300 text-xs font-semibold tracking-wide">
        Demo mode — sign up to save your schedule
      </p>
    </div>
  );
}
