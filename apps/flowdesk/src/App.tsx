import { useEffect } from 'react';
import { useStore } from './lib/store';
import { isDemoMode } from './lib/config';
import AuthScreen from './screens/AuthScreen';
import MainScreen from './screens/MainScreen';
import CockpitScreen from './screens/CockpitScreen';

export default function App() {
  const { isAuthenticated, activeTaskId } = useStore((s) => ({
    isAuthenticated: s.isAuthenticated,
    activeTaskId: s.activeTaskId,
  }));

  useEffect(() => {
    if (isDemoMode) return;
    let unsub: (() => void) | undefined;
    import('./lib/firebase').then(({ initFirebase }) => {
      unsub = initFirebase();
    });
    return () => unsub?.();
  }, []);

  if (!isAuthenticated) return <AuthScreen />;

  return (
    <div className="w-full h-full bg-navy-900">
      <MainScreen />
      {activeTaskId && <CockpitScreen />}
    </div>
  );
}
