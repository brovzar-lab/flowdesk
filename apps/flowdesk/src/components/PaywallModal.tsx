import { useStore } from '../lib/store';

export default function PaywallModal() {
  const { paywallOpen, closePaywall } = useStore((s) => ({
    paywallOpen: s.paywallOpen,
    closePaywall: s.closePaywall,
  }));

  if (!paywallOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-navy-800 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">⚡</div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Unlock FlowDesk Pro</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            You've hit the free plan limit. Upgrade to add unlimited tasks, sync Linear, and get
            AI-powered scheduling.
          </p>
        </div>

        <ul className="space-y-2 mb-6">
          {[
            'Unlimited tasks & projects',
            'Linear + Notion sync',
            'AI rescheduling on disruption',
            'Weekly flow score report',
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-300">
              <span className="text-teal-400 font-bold">✓</span>
              {feature}
            </li>
          ))}
        </ul>

        <button className="w-full bg-teal-500 hover:bg-teal-400 text-navy-900 font-bold rounded-xl py-3 text-sm transition-colors mb-3">
          Upgrade — $12/mo
        </button>
        <button
          onClick={closePaywall}
          className="w-full text-slate-500 hover:text-slate-300 text-sm py-1.5 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
