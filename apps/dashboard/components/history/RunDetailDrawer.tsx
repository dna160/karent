'use client';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import type { Run } from '@/lib/store';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';

interface Props { slug: string; runId: string; onClose: () => void }

const AGENT_COLORS: Record<string, string> = {
  'agent1-foundation': 'bg-blue-500',
  'agent2-layer':      'bg-purple-500',
  'agent3-cleanup':    'bg-orange-500',
  'agent4-finishing':  'bg-green-500',
};

export function RunDetailDrawer({ slug, runId, onClose }: Props) {
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.runs.get(slug, runId)
      .then(setRun)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, runId]);

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-bg-card border-l border-bg-border z-50 overflow-y-auto animate-slide-in">
        <div className="sticky top-0 bg-bg-card border-b border-bg-border px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-semibold text-white">Run Detail</h2>
            <p className="text-xs text-gray-500 font-mono">{runId}</p>
          </div>
          <button onClick={onClose} className="btn-ghost px-2 py-1 text-lg">×</button>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-bg-hover rounded animate-pulse" />)}
          </div>
        ) : !run ? (
          <div className="p-5 text-gray-500">Run not found</div>
        ) : (
          <div className="p-5 space-y-6">
            {/* Meta */}
            <div className="flex flex-wrap gap-3">
              <StatusBadge status={run.status} />
              <StatusBadge status={run.post_type} />
              <span className="text-xs text-gray-500">{new Date(run.created_at).toLocaleString()}</span>
              {run.completed_at && (
                <span className="text-xs text-gray-600">
                  {Math.round((new Date(run.completed_at).getTime() - new Date(run.created_at).getTime()) / 1000)}s
                </span>
              )}
            </div>

            {/* Generated image */}
            {run.clean_image_url && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Generated Image</h3>
                <img src={run.clean_image_url} alt="Generated" className="w-40 rounded-lg border border-bg-border" />
              </div>
            )}

            {/* Caption */}
            {run.caption && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Caption</h3>
                <p className="text-sm text-gray-300 whitespace-pre-wrap bg-bg-base rounded-lg p-3">{run.caption}</p>
              </div>
            )}

            {/* Song */}
            {run.selected_song && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Song</h3>
                <p className="text-sm text-gray-300">{run.selected_song.name} — {run.selected_song.artist}</p>
              </div>
            )}

            {/* Post links */}
            <div className="space-y-1">
              <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Post Links</h3>
              {run.ig_feed_url ? (
                <a href={run.ig_feed_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 text-sm hover:underline block">
                  Feed post →
                </a>
              ) : <p className="text-gray-600 text-xs">No feed post</p>}
              {run.ig_story_id && <p className="text-gray-500 text-xs">Story ID: {run.ig_story_id}</p>}
            </div>

            {/* Agent log timeline */}
            {run.agent_log && run.agent_log.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Agent Timeline</h3>
                <div className="space-y-3">
                  {run.agent_log.map((entry, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="flex flex-col items-center">
                        <div className={clsx('w-2.5 h-2.5 rounded-full mt-1', entry.status === 'ok' ? (AGENT_COLORS[entry.agent] || 'bg-gray-500') : 'bg-red-500')} />
                        {i < run.agent_log!.length - 1 && <div className="w-px flex-1 bg-bg-border mt-1" style={{ minHeight: 20 }} />}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-medium text-gray-300">{entry.agent}</p>
                        <p className="text-xs text-gray-600">{new Date(entry.started_at).toLocaleTimeString()}</p>
                        {entry.error && <p className="text-xs text-red-400 mt-1">{entry.error}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {run.error_code && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm font-medium">Error: {run.error_code}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
