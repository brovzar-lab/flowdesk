import { useQuery } from '@tanstack/react-query';
import { isDemoMode } from '../lib/demo';
import { useAppStore } from '../lib/store';
import { fetchRecentEvents } from '../lib/events';
import { fetchLiveTips, type BabySummary } from '../lib/tips';
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

function computeStats(events: BabyEvent[]): { feedsToday: number; sleepHoursToday: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86400000);

  const feedsToday = events.filter(
    (e) => e.type === 'feed' && e.timestamp >= today && e.timestamp < tomorrow,
  ).length;

  const sleepMs = events
    .filter((e): e is SleepEvent => e.type === 'sleep' && !!e.endTime)
    .filter((e) => e.startTime >= today && e.startTime < tomorrow)
    .reduce((sum, e) => sum + (e.endTime!.getTime() - e.startTime.getTime()), 0);

  return { feedsToday, sleepHoursToday: Math.round((sleepMs / 3600000) * 10) / 10 };
}

function buildTipsSummary(baby: { birthDate: Date } | null, events: BabyEvent[]): BabySummary {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const recent = events.filter((e) => e.timestamp >= oneDayAgo);
  const recentFeeds = recent.filter((e) => e.type === 'feed').length;
  const recentDiapers = recent.filter((e) => e.type === 'diaper').length;
  const recentSleepMs = recent
    .filter((e): e is SleepEvent => e.type === 'sleep')
    .reduce((sum, e) => (e.endTime ? sum + (e.endTime.getTime() - e.startTime.getTime()) : sum), 0);
  return {
    babyAgedays: baby ? Math.floor((now.getTime() - baby.birthDate.getTime()) / 86400000) : 0,
    recentFeeds,
    recentSleepHours: Math.round((recentSleepMs / 3600000) * 10) / 10,
    recentDiapers,
  };
}

export default function HomeScreen(): JSX.Element {
  const { user, baby, events: demoEvents } = useAppStore();
  const nextPrediction = DEMO_PREDICTIONS[0];

  const { data: liveEvents } = useQuery({
    queryKey: ['events', user?.uid, baby?.id],
    queryFn: () => fetchRecentEvents(user!.uid, baby!.id, 50),
    enabled: !isDemoMode && !!user && !!baby,
  });

  const events = isDemoMode ? demoEvents : (liveEvents ?? []);
  const recentEvents = events.slice(0, 6);
  const { feedsToday, sleepHoursToday } = computeStats(events);

  const tipsSummary = buildTipsSummary(baby, events);
  const { data: liveTips } = useQuery({
    queryKey: ['liveTips', tipsSummary.babyAgedays, tipsSummary.recentFeeds, tipsSummary.recentSleepHours, tipsSummary.recentDiapers],
    queryFn: () => fetchLiveTips(tipsSummary),
    enabled: !isDemoMode && !!user,
    staleTime: 5 * 60 * 1000,
  });

  const tips = !isDemoMode && liveTips
    ? liveTips.map((text, i) => ({ id: `live-${i}`, text }))
    : DEMO_TIPS;

  return (
    <div className="px-4 pt-5 pb-2 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Good morning 👋</h1>
          {baby && (
            <p className="text-sm text-gray-500">
              {baby.name} · Day {Math.floor((Date.now() - baby.birthDate.getTime()) / 86400000)}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Feeds today</p>
          <p className="text-2xl font-bold text-brand-700 mt-0.5">{feedsToday}</p>
        </div>
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Sleep today</p>
          <p className="text-2xl font-bold text-brand-700 mt-0.5">{sleepHoursToday} <span className="text-sm font-medium text-gray-500">hrs</span></p>
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
          {tips.map((tip) => (
            <div key={tip.id} className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-sm text-amber-900">{tip.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
