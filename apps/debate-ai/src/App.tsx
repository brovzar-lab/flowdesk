import { Toaster } from 'react-hot-toast';
import { useDebateStore } from './store/debateStore';
import { SetupScreen } from './screens/SetupScreen';
import { ArenaScreen } from './screens/ArenaScreen';
import { BestIdeaReveal } from './screens/BestIdeaReveal';

export default function App() {
  const phase = useDebateStore((s) => s.phase);
  const format = useDebateStore((s) => s.config.format);
  const bestIdeaResult = useDebateStore((s) => s.bestIdeaResult);

  const showBestIdeaReveal = phase === 'done' && format === 'brainstorm' && bestIdeaResult;

  return (
    <>
      {phase === 'setup' && <SetupScreen />}
      {phase !== 'setup' && !showBestIdeaReveal && <ArenaScreen />}
      {showBestIdeaReveal && <BestIdeaReveal />}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
        }}
      />
    </>
  );
}
