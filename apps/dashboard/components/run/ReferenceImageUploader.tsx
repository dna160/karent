'use client';
import { useCallback, useRef, useState } from 'react';
import clsx from 'clsx';

interface Props { files: File[]; onChange: (files: File[]) => void; max?: number }

export function ReferenceImageUploader({ files, onChange, max = 5 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) => /image\/(jpeg|png)/.test(f.type));
    const merged = [...files, ...valid].slice(0, max);
    onChange(merged);
  }, [files, max, onChange]);

  const remove = (i: number) => onChange(files.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
          dragging ? 'border-indigo-400 bg-indigo-600/5' : 'border-bg-border hover:border-gray-600',
          files.length >= max && 'opacity-40 pointer-events-none'
        )}
      >
        <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png" className="hidden" onChange={(e) => addFiles(e.target.files)} />
        <p className="text-gray-400 text-sm">Drop JPG/PNG here or <span className="text-indigo-400">browse</span></p>
        <p className="text-gray-600 text-xs mt-1">Max {max} images · Face & style references for the persona</p>
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative group">
              <img
                src={URL.createObjectURL(f)}
                alt={f.name}
                className="w-16 h-16 rounded-lg object-cover border border-bg-border"
              />
              <button
                onClick={() => remove(i)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
