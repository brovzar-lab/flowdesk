import { useState } from 'react';
import { useAuthStore } from '../lib/auth';
import { useStore } from '../lib/store';
import { updateSettings } from '../lib/firestore';
import { writeSettingsToExtension } from '../lib/chromeBridge';
import { isDemoMode } from '../lib/config';
import DemoBanner from '../components/DemoBanner';
import TaskList from '../components/TaskList';
import ScheduleTimeline from '../components/ScheduleTimeline';
import PaywallModal from '../components/PaywallModal';
import SettingsPanel from '../components/SettingsPanel';

export default function MainScreen() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user } = useAuthStore((s) => ({ user: s.user }));
  const { settings, setSettings } = useStore((s) => ({
    settings: s.settings,
    setSettings: s.setSettings,
  }));

  async function handleFocusToggle() {
    const newFocusMode = !settings.focusMode;
    const updated = { ...settings, focusMode: newFocusMode };
    setSettings(updated);
    if (!isDemoMode && user) {
      await updateSettings(user.uid, { focusMode: newFocusMode });
      writeSettingsToExtension({
        userId: user.uid,
        focusMode: newFocusMode,
        blockedSites: settings.blockedSites,
      });
    }
  }

  return (
    <div className="flex flex-col h-full bg-navy-900">
      {isDemoMode && <DemoBanner />}

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="text-sm font-bold text-slate-100 tracking-wide">FlowDesk</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>

          {/* Focus Mode toggle */}
          <button
            onClick={handleFocusToggle}
            title={settings.focusMode ? 'Focus Mode ON — click to disable' : 'Enable Focus Mode'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              settings.focusMode
                ? 'bg-teal-600/20 text-teal-400 border border-teal-600/40'
                : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${settings.focusMode ? 'bg-teal-400' : 'bg-slate-600'}`}
            />
            {settings.focusMode ? 'Focus On' : 'Focus Off'}
          </button>

          {/* Settings gear */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-slate-500 hover:text-slate-300 transition-colors text-base"
            aria-label="Open settings"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Task list */}
        <div className="w-80 flex-shrink-0 border-r border-slate-800 flex flex-col overflow-hidden relative">
          <TaskList />
        </div>

        {/* Right: Schedule timeline */}
        <div className="flex-1 overflow-hidden">
          <ScheduleTimeline />
        </div>
      </div>

      <PaywallModal />
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
