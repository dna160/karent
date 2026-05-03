'use client';
import { useState } from 'react';
import clsx from 'clsx';
import type { Post } from '@/lib/store';
import { StatusBadge } from '@/components/StatusBadge';

interface Props { posts: Post[]; loading: boolean; total: number; page: number; onPage: (p: number) => void }
type SortKey = 'posted_at' | 'likes' | 'comments' | 'reach';

export function PostsTable({ posts, loading, total, page, onPage }: Props) {
  const [sort, setSort] = useState<SortKey>('posted_at');
  const LIMIT = 20;
  const totalPages = Math.ceil(total / LIMIT);

  const SortHeader = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => setSort(k)} className={clsx('text-left text-xs font-medium hover:text-white transition-colors', sort === k ? 'text-indigo-400' : 'text-gray-500')}>
      {label}{sort === k ? ' ↓' : ''}
    </button>
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-bg-border">
              <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-4 w-12">Image</th>
              <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-4">Caption</th>
              <th className="pb-2 pr-4"><SortHeader k="posted_at" label="Posted" /></th>
              <th className="pb-2 pr-4 text-center text-xs text-gray-500 font-medium">Type</th>
              <th className="pb-2 pr-4"><SortHeader k="likes" label="Likes" /></th>
              <th className="pb-2 pr-4"><SortHeader k="comments" label="Comments" /></th>
              <th className="pb-2"><SortHeader k="reach" label="Reach" /></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-bg-border/50">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="py-3 pr-4"><div className="h-3 bg-bg-hover rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : posts.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-gray-600 text-sm">No posts yet</td></tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="border-b border-bg-border/50 hover:bg-bg-hover/30 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="w-10 h-10 rounded bg-bg-hover overflow-hidden">
                      {post.image_url ? (
                        <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full" />}
                    </div>
                  </td>
                  <td className="py-3 pr-4 max-w-xs">
                    <p className="text-gray-300 truncate text-xs">{post.caption || '—'}</p>
                  </td>
                  <td className="py-3 pr-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(post.posted_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4 text-center">
                    <StatusBadge status={post.type} />
                  </td>
                  <td className="py-3 pr-4 text-xs text-gray-300">{post.likes.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-xs text-gray-300">{post.comments.toLocaleString()}</td>
                  <td className="py-3 text-xs text-gray-300">{post.reach.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-500">{total} posts total</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => onPage(page - 1)} className="btn-ghost text-xs px-2 py-1 disabled:opacity-30">← Prev</button>
            <span className="text-xs text-gray-500 px-2 py-1">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="btn-ghost text-xs px-2 py-1 disabled:opacity-30">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
