import { useState } from 'react';
import { isDemoMode } from '../lib/config';
import { useStore } from '../lib/store';
import { signInWithGoogle } from '../lib/auth';

const PILLARS = [
  { icon: '🧠', label: 'Deep Work' },
  { icon: '📅', label: 'Smart Scheduling' },
  { icon: '🎯', label: 'Cockpit Mode' },
  { icon: '🚫', label: 'Distraction Block' },
];

export default function AuthScreen() {
  const signInDemo = useStore((s) => s.signInDemo);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('Sign-in failed. Please try again.');
      console.error(err);
    } finally {
      setSigningIn(false);
    }
  }

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
            {error && (
              <p className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-2">
                {error}
              </p>
            )}
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-800 rounded-2xl py-4 font-bold text-base transition-colors disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {signingIn ? 'Signing in…' : 'Continue with Google'}
            </button>
            <p className="text-xs text-slate-600 text-center">
              Google Calendar access lets FlowDesk schedule around your meetings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
