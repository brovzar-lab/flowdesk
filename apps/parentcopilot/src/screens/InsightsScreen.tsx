import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAppStore } from '../lib/store';
import { DEMO_PREDICTIONS } from '../lib/mockData';
import type { BabyEvent, SleepEvent } from '../lib/types';

function formatDay(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });
}

function buildChartData(events: BabyEvent[]): {
  day: string;
  feeds: number;
  sleepHours: number;
  diapers: number;
}[] {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(now);
    dayStart.setDate(now.getDate() - (6 - i));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const dayEvents = events.filter(
      (e) => e.timestamp >= dayStart && e.timestamp < dayEnd,
    );

    const feeds = dayEvents.filter((e) => e.type === 'feed').length;
    const diapers = dayEvents.filter((e) => e.type === 'diaper').length;
    const sleepMs = dayEvents
      .filter((e): e is SleepEvent => e.type === 'sleep')
      .reduce((sum, e) => {
        if (e.endTime) return sum + (e.endTime.getTime() - e.startTime.getTime());
        return sum;
      }, 0);

    return {
      day: formatDay(dayStart),
      feeds,
      sleepHours: Math.round((sleepMs / 3600000) * 10) / 10,
      diapers,
    };
  });
}

function buildSummaryStats(data: ReturnType<typeof buildChartData>) {
  const avgFeeds = data.reduce((s, d) => s + d.feeds, 0) / data.length;
  const avgSleep = data.reduce((s, d) => s + d.sleepHours, 0) / data.length;
  return {
    avgFeeds: Math.round(avgFeeds * 10) / 10,
    avgSleep: Math.round(avgSleep * 10) / 10,
  };
}

export default function InsightsScreen(): JSX.Element {
  const { events } = useAppStore();
  const chartData = buildChartData(events);
  const { avgFeeds, avgSleep } = buildSummaryStats(chartData);

  const [predictionsLoading, setPredictionsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setPredictionsLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="px-4 pt-5 pb-2 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Insights</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-brand-600">{avgFeeds}</p>
          <p className="text-xs text-gray-500 mt-1">Avg feeds/day</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-brand-600">{avgSleep}h</p>
          <p className="text-xs text-gray-500 mt-1">Avg sleep/day</p>
        </div>
      </div>

      {/* Feed chart */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Daily Feeds (last 7 days)</h2>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="feeds" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Feeds" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Sleep chart */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sleep (hrs/day, last 7 days)</h2>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="sleepHours" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Sleep hrs" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Diaper chart */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Daily Diapers (last 7 days)</h2>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="diapers" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Diapers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* AI Predictions */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">AI Predictions</h2>
        <div className="space-y-3">
          {predictionsLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-gray-200 animate-pulse">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-3 bg-gray-200 rounded w-32" />
                    <div className="h-5 bg-gray-200 rounded-full w-10" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              ))
            : DEMO_PREDICTIONS.map((pred) => (
                <div key={pred.id} className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-brand-500">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-900 text-sm">{pred.label}</p>
                    <span className="text-xs text-brand-600 font-medium bg-brand-50 px-2 py-0.5 rounded-full">
                      {Math.round(pred.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{pred.description}</p>
                </div>
              ))}
        </div>
      </section>

      {/* Pediatrician share */}
      <section>
        <button
          onClick={() => alert('In demo mode, export generates a PDF summary for your pediatrician. Backend integration coming soon.')}
          className="w-full border-2 border-brand-600 text-brand-600 rounded-xl py-3 font-semibold text-sm hover:bg-brand-50 transition-colors"
        >
          Share with Pediatrician
        </button>
      </section>
    </div>
  );
}
