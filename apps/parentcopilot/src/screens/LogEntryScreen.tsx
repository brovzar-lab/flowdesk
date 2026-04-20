import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isDemoMode } from '../lib/demo';
import { useAppStore } from '../lib/store';
import Toast from '../components/Toast';
import type { EventType, FeedMethod, DiaperType } from '../lib/types';

type LogTab = EventType;

const TABS: { id: LogTab; label: string; emoji: string }[] = [
  { id: 'feed', label: 'Feed', emoji: '🍼' },
  { id: 'sleep', label: 'Sleep', emoji: '😴' },
  { id: 'diaper', label: 'Diaper', emoji: '🫧' },
];

export default function LogEntryScreen(): JSX.Element {
  const navigate = useNavigate();
  const { baby, addEvent } = useAppStore();
  const [activeTab, setActiveTab] = useState<LogTab>('feed');
  const [toast, setToast] = useState<string | null>(null);

  // Feed state
  const [feedMethod, setFeedMethod] = useState<FeedMethod>('bottle');
  const [feedAmount, setFeedAmount] = useState('3.5');
  const [feedDuration, setFeedDuration] = useState('20');

  // Sleep state
  const [sleepStart, setSleepStart] = useState(
    () => new Date().toISOString().slice(0, 16),
  );

  // Diaper state
  const [diaperType, setDiaperType] = useState<DiaperType>('wet');

  function handleSave(): void {
    if (!baby) return;
    const now = new Date();

    if (activeTab === 'feed') {
      addEvent({
        id: `feed-${Date.now()}`,
        babyId: baby.id,
        type: 'feed',
        timestamp: now,
        method: feedMethod,
        amountOz: feedMethod === 'bottle' ? parseFloat(feedAmount) : undefined,
        durationMinutes: feedMethod === 'breast' ? parseInt(feedDuration, 10) : undefined,
      });
    } else if (activeTab === 'sleep') {
      const start = new Date(sleepStart);
      addEvent({
        id: `sleep-${Date.now()}`,
        babyId: baby.id,
        type: 'sleep',
        timestamp: start,
        startTime: start,
      });
    } else {
      addEvent({
        id: `diaper-${Date.now()}`,
        babyId: baby.id,
        type: 'diaper',
        timestamp: now,
        diaperType,
      });
    }

    if (isDemoMode) {
      setToast('Demo mode — not saved to backend');
    } else {
      setToast('Logged!');
    }
    setTimeout(() => navigate('/'), 1500);
  }

  return (
    <div className="px-4 pt-5 space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Log Entry</h1>

      {/* Tab selector */}
      <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white shadow text-brand-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed form */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
            <div className="flex gap-2">
              {(['bottle', 'breast', 'solid'] as FeedMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setFeedMethod(m)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors capitalize ${
                    feedMethod === m
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {feedMethod === 'bottle' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (oz)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="12"
                value={feedAmount}
                onChange={(e) => setFeedAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {feedMethod === 'breast' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={feedDuration}
                onChange={(e) => setFeedDuration(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Sleep form */}
      {activeTab === 'sleep' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sleep start</label>
            <input
              type="datetime-local"
              value={sleepStart}
              onChange={(e) => setSleepStart(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <p className="text-xs text-gray-400">End time can be logged when baby wakes up.</p>
        </div>
      )}

      {/* Diaper form */}
      {activeTab === 'diaper' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <div className="flex gap-2">
            {(['wet', 'dirty', 'both'] as DiaperType[]).map((t) => (
              <button
                key={t}
                onClick={() => setDiaperType(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors capitalize ${
                  diaperType === t
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        className="w-full bg-brand-600 text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-brand-700 transition-colors mt-4"
      >
        Save Entry
      </button>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
