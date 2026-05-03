'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Run } from '@/lib/store';

const AGENT_LABELS: Record<string, { label: string; step: number }> = {
  'agent1-foundation': { label: 'Agent 1 — Collecting inputs',    step: 1 },
  'agent2-layer':      { label: 'Agent 2 — Generating image',     step: 2 },
  'agent3-cleanup':    { label: 'Agent 3 — Removing watermark',   step: 3 },
  'agent4-finishing':  { label: 'Agent 4 — Posting to Instagram', step: 4 },
};

interface Props { slug: string }

export function PipelineStatusBanner({ slug }: Props) {
  const [activeRun, setActiveRun] = useState<Run | null>(null);
  const [lastLog, setLastLog] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const { data } = await api.runs.list(slug, { status: 'running', limit: 1 });
        if (!cancelled) setActiveRun(data[0] ?? null);
      } catch { /* silent */ }
    }
    poll();
    const t = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(t); };
  }, [slug]);

  // Subscribe to SSE log for latest line
  useEffect(() => {
    if (!activeRun) return;
    const { subscribeToRunLogs } = require('@/lib/api');
    const unsub = subscribeToRunLogs(slug, activeRun.id, (e) => setLastLog(e.message));
    return unsub;
  }, [activeRun?.id, slug]);

  if (!activeRun) return null;

  const logEntry = activeRun.agent_log?.[activeRun.agent_log.length - 1];
  const agentKey = logEntry?.agent || 'agent1-foundation';
  const agentInfo = AGENT_LABELS[agentKey] ?? { label: 'Processing…', step: 1 };
  const pct = Math.round((agentInfo.step / 4) * 100);

  return (
    <div className="card border-indigo-500/30 bg-indigo-600/5 px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-sm font-medium text-white">{agentInfo.label}</span>
          <span className="text-xs text-gray-500">({agentInfo.step}/4)</span>
        </div>
        <span className="text-xs text-gray-500 font-mono">{activeRun.id.slice(0, 8)}</span>
      </div>
      <div className="h-1.5 bg-bg-border rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {lastLog && (
        <p className="text-xs text-gray-500 truncate font-mono">{lastLog}</p>
      )}
    </div>
  );
}
