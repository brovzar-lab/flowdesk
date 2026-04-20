import { useState } from 'react';
import { isDemoMode } from '../lib/demo';
import { useAppStore } from '../lib/store';

export default function AuthScreen(): JSX.Element {
  const setUser = useAppStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  function handleDemoLogin(): void {
    setUser({ uid: 'demo', email: 'demo@parentcopilot.app', displayName: 'Demo Parent', isDemo: true });
  }

  async function handleSignIn(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../lib/firebase');
      if (!auth) return;
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setUser({
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
        isDemo: false,
      });
    } catch {
      alert('Sign in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-brand-600 to-brand-700 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">👶</div>
          <h1 className="text-3xl font-bold text-white">ParentCoPilot</h1>
          <p className="text-brand-100 mt-2 text-sm">AI-powered baby tracking for new parents</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {!isDemoMode && (
            <form onSubmit={handleSignIn} className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          )}

          <button
            onClick={handleDemoLogin}
            className="w-full border-2 border-brand-600 text-brand-600 rounded-lg py-2.5 font-semibold text-sm hover:bg-brand-50 transition-colors"
          >
            Continue as Demo User
          </button>
        </div>
      </div>
    </div>
  );
}
