import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStore } from './lib/store';
import { useAuthStore, initAuth } from './lib/auth';
import { isDemoMode } from './lib/config';
import { initUserSettings } from './lib/firestore';
import AuthScreen from './screens/AuthScreen';
import MainScreen from './screens/MainScreen';
import CockpitScreen from './screens/CockpitScreen';

const queryClient = new QueryClient();

function FlowDeskApp() {
  const { isAuthenticated, activeTaskId } = useStore((s) => ({
    isAuthenticated: s.isAuthenticated,
    activeTaskId: s.activeTaskId,
  }));
  const { user, loading } = useAuthStore((s) => ({
    user: s.user,
    loading: s.loading,
  }));

  useEffect(() => {
    if (isDemoMode) return;
    const unsub = initAuth();
    return unsub;
  }, []);

  // Sync Firebase user → store auth state and init settings on first login
  useEffect(() => {
    if (isDemoMode) return;
    useStore.setState({ isAuthenticated: !!user });
    if (user) {
      initUserSettings(user.uid).catch(console.error);
    }
  }, [user]);

  if (!isDemoMode && loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <span className="text-slate-500 text-sm">Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated) return <AuthScreen />;

  return (
    <div className="w-full h-full bg-navy-900">
      <MainScreen />
      {activeTaskId && <CockpitScreen />}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FlowDeskApp />
    </QueryClientProvider>
  );
}
