import { Toaster } from 'react-hot-toast';
import { useDebateStore } from './store/debateStore';
import { SetupScreen } from './screens/SetupScreen';

export default function App() {
  const phase = useDebateStore((s) => s.phase);

  return (
    <>
      {phase === 'setup' && <SetupScreen />}
      {phase !== 'setup' && (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="text-center space-y-3 px-6">
            <h2 className="text-2xl font-bold">Debate in Progress</h2>
            <p className="text-slate-500 text-sm">
              Arena view coming in the next task — Web II is on it.
            </p>
          </div>
        </div>
      )}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
        }}
      />
    </>
  );
}
