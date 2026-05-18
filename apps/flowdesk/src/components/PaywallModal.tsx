import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { useStore } from '../lib/store';
import { isDemoMode } from '../lib/config';

interface CheckoutResult {
  url: string;
}

const PRO_FEATURES = [
  'Unlimited tasks',
  'Unlimited AI plans',
  'Unlimited blocked sites',
  'Analytics dashboard',
];

export default function PaywallModal() {
  const [upgrading, setUpgrading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [demoToast, setDemoToast] = useState(false);

  const { paywallOpen, closePaywall } = useStore((s) => ({
    paywallOpen: s.paywallOpen,
    closePaywall: s.closePaywall,
  }));

  if (!paywallOpen) return null;

  async function handleUpgrade() {
    if (isDemoMode) {
      setDemoToast(true);
      setTimeout(() => setDemoToast(false), 3000);
      return;
    }

    setUpgrading(true);
    setErrorMsg(null);
    try {
      const createSession = httpsCallable<unknown, CheckoutResult>(
        functions,
        'createCheckoutSession',
      );
      const result = await createSession({});
      window.open(result.data.url, '_blank');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-navy-800 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        {demoToast && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-slate-700 text-slate-300 text-xs text-center">
            Demo mode — upgrade not available
          </div>
        )}

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">⚡</div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Unlock FlowDesk Pro</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            You've hit the free plan limit. Upgrade to unlock everything.
          </p>
        </div>

        <ul className="space-y-2 mb-6">
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-300">
              <span className="text-teal-400 font-bold">✓</span>
              {feature}
            </li>
          ))}
        </ul>

        {errorMsg && (
          <p className="text-red-400 text-xs text-center mb-3">{errorMsg}</p>
        )}

        <button
          onClick={() => void handleUpgrade()}
          disabled={upgrading}
          className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-navy-900 font-bold rounded-xl py-3 text-sm transition-colors mb-3 flex items-center justify-center gap-2"
        >
          {upgrading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-navy-900/40 border-t-navy-900 rounded-full animate-spin" />
              Opening checkout…
            </>
          ) : (
            'Upgrade — $8/mo'
          )}
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
