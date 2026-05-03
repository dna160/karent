'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint { week_start: string; count: number }
interface Props { data: DataPoint[]; loading: boolean }

export function PostsOverTimeChart({ data, loading }: Props) {
  if (loading) return <div className="h-48 bg-bg-hover rounded-lg animate-pulse" />;
  if (!data.length) return <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No data yet</div>;

  const formatted = data.map((d) => ({
    week: new Date(d.week_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    posts: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#e5e5e5', fontSize: 12 }}
          cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
        />
        <Line type="monotone" dataKey="posts" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
