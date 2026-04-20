import { useAppStore } from '../lib/store';
import { DEMO_PREDICTIONS, DEMO_TIPS } from '../lib/mockData';
import type { BabyEvent, FeedEvent, SleepEvent } from '../lib/types';

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

function eventEmoji(event: BabyEvent): string {
  if (event.type === 'feed') return '🍼';
  if (event.type === 'sleep') return '😴';
  return '🫧';
}

function eventLabel(event: BabyEvent): string {
  if (event.type === 'feed') {
    const f = event as FeedEvent;
    return f.method === 'breast' ? 'Breastfed' : f.amountOz ? `Bottle — ${f.amountOz} oz` : 'Fed';
  }
  if (event.type === 'sleep') {
    const s = event as SleepEvent;
    if (s.endTime) {
      const dur = Math.round((s.endTime.getTime() - s.startTime.getTime()) / 60000);
      return `Slept ${dur}m`;
    }
    return 'Sleeping…';
  }
  return `Diaper — ${(event as { diaperType: string }).diaperType}`;
}

export default function HomeScreen(): JSX.Element {
  const { baby, events } = useAppStore();
  const recentEvents = events.slice(0, 6);
  const nextPrediction = DEMO_PREDICTIONS[0];

  return (
    <div className="px-4 pt-5 pb-2 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Good morning 👋</h1>
          {baby && <p className="text-sm text-gray-500">{baby.name} · Day {Math.floor((Date.now() - baby.birthDate.getTime()) / 86400000)}</p>}
        </div>
      </div>

      {/* Next prediction card */}
      {nextPrediction.estimatedTime && (
        <div className="bg-brand-600 rounded-2xl p-4 text-white shadow-md">
          <p className="text-brand-100 text-xs font-medium uppercase tracking-wide mb-1">Up Next</p>
          <p className="text-lg font-bold">{nextPrediction.label}</p>
          <p className="text-brand-100 text-sm mt-1">{nextPrediction.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
              ~{formatTime(nextPrediction.estimatedTime)}
            </div>
            <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
              {Math.round(nextPrediction.confidence * 100)}% confidence
            </div>
          </div>
        </div>
      )}

      {/* Recent events */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Events</h2>
        <div className="space-y-2">
          {recentEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
              <span className="text-2xl">{eventEmoji(event)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{eventLabel(event)}</p>
                <p className="text-xs text-gray-400">{formatRelative(event.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live tips */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Tips for Today</h2>
        <div className="space-y-2">
          {DEMO_TIPS.map((tip) => (
            <div key={tip.id} className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-sm text-amber-900">{tip.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
