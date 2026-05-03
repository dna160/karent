'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { Post, Run, StatsData } from '@/lib/store';
import { QuickStatsBar } from '@/components/overview/QuickStatsBar';
import { PipelineStatusBanner } from '@/components/overview/PipelineStatusBanner';
import { RecentPostsGrid } from '@/components/overview/RecentPostsGrid';
import { LastRunCard } from '@/components/overview/LastRunCard';

export default function OverviewPage() {
  const { activeAccount } = useStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastRun, setLastRun] = useState<Run | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeAccount) return;
    setLoading(true);

    Promise.all([
      api.posts.list(activeAccount.slug, { limit: 9 }),
      api.runs.list(activeAccount.slug, { limit: 1 }),
      api.posts.stats(activeAccount.slug),
    ])
      .then(([postsRes, runsRes, statsData]) => {
        setPosts(postsRes.data);
        setLastRun(runsRes.data[0] ?? null);
        setStats(statsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeAccount?.slug]);

  if (!activeAccount) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No account selected.</p>
          <p className="text-gray-600 text-sm">Add an account using the sidebar to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{activeAccount.display_name}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          @{activeAccount.instagram_handle || activeAccount.slug} · Overview
        </p>
      </div>

      {/* Pipeline status — only shown when a run is active */}
      <PipelineStatusBanner slug={activeAccount.slug} />

      {/* Quick stats */}
      <QuickStatsBar stats={stats} loading={loading} />

      <div className="grid grid-cols-3 gap-6">
        {/* Recent posts grid — takes 2/3 */}
        <div className="col-span-2">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Recent Posts</h2>
          <RecentPostsGrid posts={posts} loading={loading} />
        </div>

        {/* Last run card — takes 1/3 */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-3">Last Run</h2>
          <LastRunCard run={lastRun} loading={loading} />
        </div>
      </div>
    </div>
  );
}
