'use client';
import type { StatsData } from '@/lib/store';

interface Props { stats: StatsData | null; loading: boolean }

export function QuickStatsBar({ stats, loading }: Props) {
  const chips = [
    { label: 'Posts this month', value: stats?.posts_this_month ?? '—' },
    { label: 'Total runs',       value: stats?.total_runs ?? '—' },
    { label: 'Success rate',     value: stats ? `${stats.success_rate}%` : '—' },
    {
      label: 'Last post',
      value: stats?.last_posted_at
        ? new Date(stats.last_posted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : 'Never',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {chips.map((c) => (
        <div key={c.label} className="card px-4 py-3">
          {loading ? (
            <div className="h-6 w-12 bg-bg-hover rounded animate-pulse mb-1" />
          ) : (
            <p className="text-2xl font-bold text-white">{c.value}</p>
          )}
          <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
