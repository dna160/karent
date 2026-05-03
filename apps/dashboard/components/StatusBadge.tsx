'use client';
import clsx from 'clsx';

type Status = 'pending' | 'running' | 'completed' | 'failed' | 'review' | 'active' | 'paused' | 'archived' | 'feed' | 'story' | 'both';

const DOT_ANIMATE: Status[] = ['running'];

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={clsx('badge', `badge-${status}`)}>
      {DOT_ANIMATE.includes(status) && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
      )}
      {status}
    </span>
  );
}
