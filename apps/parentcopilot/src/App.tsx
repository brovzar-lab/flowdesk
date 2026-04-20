import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isDemoMode } from './lib/demo';
import { useAppStore } from './lib/store';
import BottomNav from './components/BottomNav';
import DemoBanner from './components/DemoBanner';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import LogEntryScreen from './screens/LogEntryScreen';
import InsightsScreen from './screens/InsightsScreen';

export default function App(): JSX.Element {
  const user = useAppStore((s) => s.user);

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <BrowserRouter>
      {isDemoMode && <DemoBanner />}
      <div className="flex flex-col min-h-screen max-w-md mx-auto">
        <main className="flex-1 overflow-y-auto pb-20">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/log" element={<LogEntryScreen />} />
            <Route path="/insights" element={<InsightsScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
