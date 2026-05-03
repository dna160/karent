'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props { data: { type: string; count: number }[]; loading: boolean }

const COLORS: Record<string, string> = { feed: '#6366f1', story: '#f97316', both: '#22c55e' };

export function PostTypeSplit({ data, loading }: Props) {
  if (loading) return <div className="h-40 bg-bg-hover rounded-lg animate-pulse" />;
  if (!data.length) return <div className="h-40 flex items-center justify-center text-gray-600 text-sm">No data</div>;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="type" innerRadius={40} outerRadius={65} paddingAngle={3}>
          {data.map((entry) => (
            <Cell key={entry.type} fill={COLORS[entry.type] || '#6b7280'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#e5e5e5', fontSize: 12 }}
        />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
