'use client';
import Link from 'next/link';
import type { Run } from '@/lib/store';
import { StatusBadge } from '@/components/StatusBadge';

interface Props { run: Run | null; loading: boolean }

export function LastRunCard({ run, loading }: Props) {
  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-4 w-24 bg-bg-hover rounded mb-3" />
        <div className="h-3 w-48 bg-bg-hover rounded" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="card p-4">
        <p className="text-sm text-gray-500">No runs yet. <Link href="/run" className="text-indigo-400 hover:underline">Run your first pipeline →</Link></p>
      </div>
    );
  }

  const duration =
    run.completed_at
      ? `${Math.round((new Date(run.completed_at).getTime() - new Date(run.created_at).getTime()) / 1000)}s`
      : run.status === 'running' ? 'In progress…' : '—';

  return (
    <div className="card p-4 flex gap-4 items-start">
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg bg-bg-hover flex-shrink-0 overflow-hidden">
        {run.clean_image_url ? (
          <img src={run.clean_image_url} alt="run" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">—</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <StatusBadge status={run.status} />
          <span className="text-xs text-gray-500 font-mono">{run.id.slice(0, 8)}</span>
          <span className="text-xs text-gray-600">{duration}</span>
        </div>
        <p className="text-xs text-gray-500 mb-1">{new Date(run.created_at).toLocaleString()}</p>
        {run.caption && (
          <p className="text-sm text-gray-300 truncate">{run.caption}</p>
        )}
        {run.error_code && (
          <p className="text-xs text-red-400 mt-1">Error: {run.error_code}</p>
        )}
      </div>

      <Link href={`/history`} className="text-xs text-indigo-400 hover:underline flex-shrink-0">
        Full log →
      </Link>
    </div>
  );
}
