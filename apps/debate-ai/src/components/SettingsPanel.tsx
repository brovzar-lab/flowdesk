import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSettingsStore } from '../store/settingsStore';

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const { openRouterKey, setOpenRouterKey } = useSettingsStore();
  const [keyInput, setKeyInput] = useState(openRouterKey ?? '');

  function handleSave() {
    setOpenRouterKey(keyInput);
    toast.success(keyInput.trim() ? 'API key saved' : 'API key cleared');
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div
        className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-700/60 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white text-xl leading-none transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800"
            aria-label="Close settings"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="openrouter-key"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              OpenRouter API Key
            </label>
            <input
              id="openrouter-key"
              type="password"
              placeholder="sk-or-..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="w-full bg-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 border border-slate-700/60 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/50"
            />
            <p className="text-xs text-slate-600 mt-2">
              Get your key at openrouter.ai/keys. Stored locally in your browser only.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              className="flex-1 bg-white text-black font-semibold py-2.5 rounded-xl hover:bg-slate-100 transition-colors text-sm"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-slate-800 text-white font-medium py-2.5 rounded-xl hover:bg-slate-700 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
