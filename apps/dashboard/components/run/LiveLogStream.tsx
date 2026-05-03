'use client';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { subscribeToRunLogs, type LogEvent } from '@/lib/api';

const AGENT_COLORS: Record<string, string> = {
  'agent1-foundation': 'text-blue-400',
  'agent2-layer':      'text-purple-400',
  'agent3-cleanup':    'text-orange-400',
  'agent4-finishing':  'text-green-400',
};

const LEVEL_COLORS: Record<string, string> = {
  info:  'text-gray-300',
  warn:  'text-yellow-400',
  error: 'text-red-400',
};

interface Props { slug: string; runId: string }

export function LiveLogStream({ slug, runId }: Props) {
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConnected(false);
    setEvents([]);
    const unsub = subscribeToRunLogs(
      slug,
      runId,
      (e) => {
        setConnected(true);
        setEvents((prev) => [...prev, e]);
      },
      () => setConnected(false)
    );
    return unsub;
  }, [slug, runId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-bg-border">
        <span className="text-xs font-medium text-gray-400">Live Log — {runId.slice(0, 8)}</span>
        <span className={clsx('flex items-center gap-1.5 text-xs', connected ? 'text-green-400' : 'text-gray-600')}>
          <span className={clsx('w-1.5 h-1.5 rounded-full', connected ? 'bg-green-400 animate-pulse' : 'bg-gray-600')} />
          {connected ? 'Connected' : 'Waiting…'}
        </span>
      </div>
      <div className="h-64 overflow-y-auto font-mono text-xs p-3 space-y-0.5">
        {events.length === 0 && (
          <span className="text-gray-600">Waiting for log events…</span>
        )}
        {events.map((e, i) => (
          <div key={i} className="flex gap-2 leading-5">
            <span className="text-gray-600 flex-shrink-0">{new Date(e.timestamp).toLocaleTimeString()}</span>
            <span className={clsx('flex-shrink-0 w-28 truncate', AGENT_COLORS[e.agent] || 'text-gray-500')}>{e.agent}</span>
            <span className={clsx(LEVEL_COLORS[e.level] || 'text-gray-300', 'break-all')}>{e.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
