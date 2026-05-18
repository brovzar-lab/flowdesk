import { isDemoMode } from '../lib/config';
import { useStore } from '../lib/store';

const PILLARS = [
  { icon: '🧠', label: 'Deep Work' },
  { icon: '📅', label: 'Smart Scheduling' },
  { icon: '🎯', label: 'Cockpit Mode' },
  { icon: '🚫', label: 'Distraction Block' },
];

export default function AuthScreen() {
  const signInDemo = useStore((s) => s.signInDemo);

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center p-7">
      <div className="w-full max-w-md">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">⚡</div>
          <h1 className="text-4xl font-extrabold text-slate-100 tracking-tight mb-2">FlowDesk</h1>
          <p className="text-slate-400 text-base">Your AI workday planner. Deep work, by design.</p>
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-10">
          {PILLARS.map((p) => (
            <span
              key={p.label}
              className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-300"
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </span>
          ))}
        </div>

        {isDemoMode ? (
          <div className="bg-teal-600/10 border border-teal-700/40 rounded-2xl p-6 space-y-3">
            <p className="text-teal-400 font-bold text-base">Demo Mode Active</p>
            <p className="text-slate-400 text-sm leading-relaxed">
              5 pre-seeded tasks and a full day schedule are loaded. No backend credentials
              required.
            </p>
            <button
              onClick={signInDemo}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-2xl py-4 font-bold text-base transition-colors"
            >
              Continue as Demo User →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-2xl py-4 font-bold text-base transition-colors">
              Get Started — Free
            </button>
            <p className="text-xs text-slate-600 text-center">
              No account needed to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
