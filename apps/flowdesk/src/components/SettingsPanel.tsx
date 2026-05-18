import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../lib/auth';
import { useStore } from '../lib/store';
import { updateSettings, type UserSettings } from '../lib/firestore';
import { writeSettingsToExtension } from '../lib/chromeBridge';
import { isDemoMode } from '../lib/config';

interface Props {
  onClose: () => void;
}

const WORK_START_OPTIONS = [6, 7, 8, 9, 10, 11, 12];
const WORK_END_OPTIONS = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

function formatHour(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const display = h === 12 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${period}`;
}

export default function SettingsPanel({ onClose }: Props) {
  const { user } = useAuthStore((s) => ({ user: s.user }));
  const storeSettings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);

  const [local, setLocal] = useState<UserSettings>(storeSettings);
  const [newSite, setNewSite] = useState('');
  const [toast, setToast] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal(storeSettings);
  }, [storeSettings]);

  const persistSettings = useCallback(
    (settings: UserSettings) => {
      setSettings(settings);
      if (isDemoMode) {
        setToast('Demo mode — not saved');
        setTimeout(() => setToast(''), 2000);
        return;
      }
      if (!user) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        updateSettings(user.uid, settings).catch(() => null);
        writeSettingsToExtension({
          userId: user.uid,
          focusMode: settings.focusMode,
          blockedSites: settings.blockedSites,
        });
      }, 500);
    },
    [user, setSettings],
  );

  function handleChange(patch: Partial<UserSettings>) {
    const updated = { ...local, ...patch };
    setLocal(updated);
    persistSettings(updated);
  }

  function addSite() {
    const domain = newSite
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');
    if (!domain || local.blockedSites.includes(domain)) {
      setNewSite('');
      return;
    }
    handleChange({ blockedSites: [...local.blockedSites, domain] });
    setNewSite('');
  }

  function removeSite(domain: string) {
    handleChange({ blockedSites: local.blockedSites.filter((d) => d !== domain) });
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Slide-over */}
      <div className="fixed right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-700 z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 flex-shrink-0">
          <span className="text-sm font-semibold text-slate-100">Settings</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl leading-none"
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Work Hours */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Work Hours
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Start</label>
                <select
                  className="bg-slate-800 text-slate-100 text-sm rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-teal-500"
                  value={local.workdayStart}
                  onChange={(e) => handleChange({ workdayStart: Number(e.target.value) })}
                >
                  {WORK_START_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {formatHour(h)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">End</label>
                <select
                  className="bg-slate-800 text-slate-100 text-sm rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-teal-500"
                  value={local.workdayEnd}
                  onChange={(e) => handleChange({ workdayEnd: Number(e.target.value) })}
                >
                  {WORK_END_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {formatHour(h)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Focus Mode */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Focus Mode
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Enable Focus Mode</span>
              <button
                role="switch"
                aria-checked={local.focusMode}
                onClick={() => handleChange({ focusMode: !local.focusMode })}
                className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                  local.focusMode ? 'bg-teal-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    local.focusMode ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Blocked Sites */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Blocked Sites
            </h3>
            <div className="space-y-1 mb-3">
              {local.blockedSites.map((d) => (
                <div
                  key={d}
                  className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-800"
                >
                  <span className="text-sm text-slate-300 font-mono truncate">{d}</span>
                  <button
                    onClick={() => removeSite(d)}
                    className="text-slate-500 hover:text-red-400 text-sm ml-2 flex-shrink-0"
                    aria-label={`Remove ${d}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              {local.blockedSites.length === 0 && (
                <p className="text-xs text-slate-600 italic">No blocked sites</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="twitter.com"
                value={newSite}
                onChange={(e) => setNewSite(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSite()}
                className="flex-1 bg-slate-800 text-slate-100 text-sm rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-teal-500 placeholder-slate-600"
              />
              <button
                onClick={addSite}
                className="px-3 py-1 text-sm bg-teal-600 hover:bg-teal-500 text-white rounded transition-colors"
              >
                Add
              </button>
            </div>
          </section>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mx-4 mb-4 px-3 py-2 rounded bg-slate-700 text-slate-300 text-xs text-center flex-shrink-0">
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
