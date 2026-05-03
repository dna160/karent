'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useStore, type Run } from '@/lib/store';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { RunDetailDrawer } from '@/components/history/RunDetailDrawer';

type FilterStatus = 'all' | 'completed' | 'failed' | 'review' | 'running' | 'pending';
const FILTERS: FilterStatus[] = ['all', 'completed', 'failed', 'review', 'running', 'pending'];

export default function HistoryPage() {
  const { activeAccount } = useStore();
  const [runs, setRuns] = useState<Run[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeAccount) return;
    setLoading(true);
    api.runs.list(activeAccount.slug, { status: filter === 'all' ? undefined : filter, page, limit: 20 })
      .then(({ data, meta }) => { setRuns(data); setTotal(meta?.total ?? 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeAccount?.slug, filter, page]);

  if (!activeAccount) return <div className="flex items-center justify-center h-screen text-gray-500">Select an account</div>;

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Run History</h1>
        <p className="text-gray-500 text-sm mt-0.5">{activeAccount.display_name} · {total} runs total</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-bg-card border border-bg-border rounded-lg p-1 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs capitalize transition-colors',
              filter === f ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Runs table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-bg-border">
              {['Run ID', 'Date', 'Status', 'Type', 'Image', 'Caption', 'Duration'].map((h) => (
                <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-bg-border/50">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-bg-hover rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : runs.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-600">No runs found</td></tr>
            ) : (
              runs.map((run) => {
                const duration = run.completed_at
                  ? `${Math.round((new Date(run.completed_at).getTime() - new Date(run.created_at).getTime()) / 1000)}s`
                  : '—';
                return (
                  <tr
                    key={run.id}
                    onClick={() => setSelectedRunId(run.id)}
                    className="border-b border-bg-border/50 hover:bg-bg-hover/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{run.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(run.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={run.status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={run.post_type} /></td>
                    <td className="px-4 py-3">
                      <div className="w-9 h-9 rounded bg-bg-hover overflow-hidden">
                        {run.clean_image_url ? (
                          <img src={run.clean_image_url} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs text-gray-400 truncate">{run.caption || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{duration}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-ghost text-xs disabled:opacity-30">← Prev</button>
          <span className="text-xs text-gray-500">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn-ghost text-xs disabled:opacity-30">Next →</button>
        </div>
      )}

      {/* Run detail drawer */}
      {selectedRunId && (
        <RunDetailDrawer slug={activeAccount.slug} runId={selectedRunId} onClose={() => setSelectedRunId(null)} />
      )}
    </div>
  );
}
