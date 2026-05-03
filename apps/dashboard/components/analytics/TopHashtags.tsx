'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Post } from '@/lib/store';

interface Props { posts: Post[]; loading: boolean }

export function TopHashtags({ posts, loading }: Props) {
  if (loading) return <div className="h-40 bg-bg-hover rounded-lg animate-pulse" />;

  // Count hashtags from all captions
  const freq: Record<string, number> = {};
  for (const post of posts) {
    const tags = (post.caption || '').match(/#\w+/g) || [];
    for (const tag of tags) {
      const t = tag.toLowerCase();
      freq[t] = (freq[t] || 0) + 1;
    }
  }

  const data = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  if (!data.length) return <div className="h-40 flex items-center justify-center text-gray-600 text-sm">No hashtag data</div>;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
        <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="tag" width={90} tick={{ fill: '#9ca3af', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#e5e5e5', fontSize: 12 }}
          cursor={{ fill: '#ffffff08' }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? '#6366f1' : '#6366f140'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
