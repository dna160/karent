'use client';
import { useState } from 'react';
import type { Post } from '@/lib/store';

interface Props { posts: Post[]; loading: boolean }

export function RecentPostsGrid({ posts, loading }: Props) {
  const [selected, setSelected] = useState<Post | null>(null);
  const cells = Array.from({ length: 9 }, (_, i) => posts[i] ?? null);

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {loading
          ? Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-bg-hover rounded-lg animate-pulse" />
            ))
          : cells.map((post, i) =>
              post ? (
                <button
                  key={post.id}
                  onClick={() => setSelected(post)}
                  className="aspect-square relative rounded-lg overflow-hidden group bg-bg-hover"
                >
                  {post.image_url ? (
                    <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">No image</div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                    <span className="text-white text-xs font-medium">❤ {post.likes}</span>
                    <span className="text-white text-[10px] text-center line-clamp-2">{post.caption}</span>
                  </div>
                  <span className="absolute top-1.5 right-1.5 badge badge-{post.type} text-[9px]">{post.type}</span>
                </button>
              ) : (
                <div key={i} className="aspect-square rounded-lg bg-bg-hover border border-dashed border-bg-border flex items-center justify-center">
                  <span className="text-gray-700 text-xs">—</span>
                </div>
              )
            )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="card p-5 max-w-sm w-full animate-fade-in" onClick={(e) => e.stopPropagation()}>
            {selected.image_url && (
              <img src={selected.image_url} alt="Post" className="w-full rounded-lg mb-4 object-cover" style={{ maxHeight: 320 }} />
            )}
            <div className="flex gap-4 mb-3 text-sm">
              <span className="text-gray-400">❤ <span className="text-white">{selected.likes}</span></span>
              <span className="text-gray-400">💬 <span className="text-white">{selected.comments}</span></span>
              <span className="text-gray-400">👁 <span className="text-white">{selected.reach}</span></span>
            </div>
            <p className="text-sm text-gray-300 mb-3 whitespace-pre-wrap">{selected.caption}</p>
            <p className="text-xs text-gray-600">{new Date(selected.posted_at).toLocaleString()}</p>
            {selected.permalink && (
              <a href={selected.permalink} target="_blank" rel="noopener noreferrer" className="text-indigo-400 text-xs hover:underline mt-2 inline-block">
                View on Instagram →
              </a>
            )}
            <button onClick={() => setSelected(null)} className="btn-ghost w-full mt-3 text-center">Close</button>
          </div>
        </div>
      )}
    </>
  );
}
