'use client';

import { useEffect, useState } from 'react';
import { useStore, type Post, type StatsData } from '@/lib/store';
import { api } from '@/lib/api';
import { PostsOverTimeChart } from '@/components/analytics/PostsOverTimeChart';
import { PostTypeSplit } from '@/components/analytics/PostTypeSplit';
import { TopHashtags } from '@/components/analytics/TopHashtags';
import { PostsTable } from '@/components/analytics/PostsTable';

export default function AnalyticsPage() {
  const { activeAccount } = useStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!activeAccount) return;
    setStatsLoading(true);
    api.posts.stats(activeAccount.slug)
      .then(setStats)
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, [activeAccount?.slug]);

  useEffect(() => {
    if (!activeAccount) return;
    setLoading(true);
    api.posts.list(activeAccount.slug, { page, limit: 20 })
      .then(({ data, meta }) => { setPosts(data); setTotal(meta?.total ?? 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeAccount?.slug, page]);

  if (!activeAccount) return <div className="flex items-center justify-center h-screen text-gray-500">Select an account</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">{activeAccount.display_name}</p>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 card p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Posts over time</h3>
          <PostsOverTimeChart data={stats?.weekly_posts ?? []} loading={statsLoading} />
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Post type split</h3>
          <PostTypeSplit data={stats?.post_type_split ?? []} loading={statsLoading} />
        </div>
      </div>

      {/* Top hashtags */}
      <div className="card p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Top hashtags</h3>
        <TopHashtags posts={posts} loading={loading} />
      </div>

      {/* Posts table */}
      <div className="card p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-4">All posts</h3>
        <PostsTable posts={posts} loading={loading} total={total} page={page} onPage={setPage} />
      </div>
    </div>
  );
}
