import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDebateStore } from '../store/debateStore';
import { useSettingsStore } from '../store/settingsStore';
import { ModelPalette } from '../components/ModelPalette';
import { DebaterPodium } from '../components/DebaterPodium';
import { SettingsPanel } from '../components/SettingsPanel';
import { DemoBadge } from '../components/DemoBadge';

export function SetupScreen() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const topic = useDebateStore((s) => s.config.topic);
  const leftDebater = useDebateStore((s) => s.config.leftDebater);
  const rightDebater = useDebateStore((s) => s.config.rightDebater);
  const setTopic = useDebateStore((s) => s.setTopic);
  const startDebate = useDebateStore((s) => s.startDebate);
  const isDemoMode = useSettingsStore((s) => s.isDemoMode);

  const canStart = Boolean(topic.trim() && leftDebater && rightDebater);

  function handleStart() {
    if (!canStart) return;
    if (isDemoMode) {
      toast('Demo mode — not saved', { icon: 'ℹ️' });
    }
    startDebate();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DemoBadge />

      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Debate AI</h1>
          <p className="text-xs text-slate-600 mt-0.5">Pit two AI models against each other</p>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Settings
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-10">
        <section>
          <label
            htmlFor="debate-topic"
            className="block text-sm font-semibold text-slate-300 mb-2"
          >
            Debate Topic
          </label>
          <input
            id="debate-topic"
            type="text"
            placeholder="What should they debate? Be specific and provocative."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/50 transition-colors"
          />
        </section>

        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Assign Debaters
          </h2>
          <div className="flex items-start gap-6">
            <DebaterPodium side="left" />
            <div className="flex items-center justify-center pt-12 shrink-0">
              <span className="text-slate-700 font-bold text-lg select-none">VS</span>
            </div>
            <DebaterPodium side="right" />
          </div>
        </section>

        <section>
          <ModelPalette />
        </section>

        <section className="flex justify-center pb-4">
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="bg-white text-black font-bold px-14 py-4 rounded-2xl text-sm uppercase tracking-widest transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed hover:enabled:bg-slate-100 hover:enabled:scale-105 active:enabled:scale-100"
          >
            Start Debate
          </button>
        </section>
      </main>

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
