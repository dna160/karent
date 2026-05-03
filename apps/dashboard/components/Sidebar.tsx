'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useStore, type Account, type PersonaProfile } from '@/lib/store';
import { api } from '@/lib/api';

const NAV = [
  { href: '/',          label: 'Overview',    icon: '◈' },
  { href: '/analytics', label: 'Analytics',   icon: '▲' },
  { href: '/run',       label: 'Run Pipeline',icon: '▶' },
  { href: '/history',   label: 'Run History', icon: '≡' },
  { href: '/settings',  label: 'Settings',    icon: '⚙' },
];

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export function Sidebar() {
  const pathname = usePathname();
  const { accounts, activeAccount, setAccounts, setActiveAccount } = useStore();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.accounts.list()
      .then(setAccounts)
      .catch(console.error);
  }, [setAccounts]);

  return (
    <div className="flex flex-col h-screen py-4">
      {/* Logo */}
      <div className="px-4 mb-6">
        <span className="text-indigo-400 font-bold text-lg tracking-tight">KARENT</span>
        <span className="text-gray-600 text-xs ml-2">PERSONA ENGINE</span>
      </div>

      {/* Navigation */}
      <nav className="px-2 mb-6">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5',
              pathname === item.href
                ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                : 'text-gray-400 hover:text-white hover:bg-bg-hover'
            )}
          >
            <span className="text-xs w-4 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-4 mb-2">
        <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Accounts</p>
      </div>

      {/* Account list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {accounts.length === 0 && (
          <p className="text-xs text-gray-600 px-3 py-2">No accounts yet.</p>
        )}
        {accounts.map((acc) => (
          <button
            key={acc.slug}
            onClick={() => setActiveAccount(acc)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
              activeAccount?.slug === acc.slug
                ? 'bg-indigo-600/15 border border-indigo-500/30'
                : 'hover:bg-bg-hover border border-transparent'
            )}
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
              {initials(acc.display_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{acc.display_name}</p>
              <p className="text-[10px] text-gray-500 truncate">@{acc.instagram_handle || acc.slug}</p>
            </div>
            <span className={clsx('badge text-[9px]', `badge-${acc.status}`)}>
              {acc.status}
            </span>
          </button>
        ))}
      </div>

      {/* Add account button */}
      <div className="px-2 mt-2 pt-2 border-t border-bg-border">
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-bg-hover transition-colors"
        >
          <span className="text-lg leading-none">+</span> Add Account
        </button>
      </div>

      {showModal && <AddAccountModal onClose={() => setShowModal(false)} onCreated={(acc) => {
        setAccounts([...accounts, acc]);
        setActiveAccount(acc);
        setShowModal(false);
      }} />}
    </div>
  );
}

// ── Add Account Modal — 2-step ────────────────────────────────────────────────
function AddAccountModal({ onClose, onCreated }: { onClose: () => void; onCreated: (acc: Account) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ slug: '', display_name: '', instagram_handle: '' });
  const [baseImages, setBaseImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function addFiles(list: FileList | File[]) {
    const arr = Array.from(list).filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
    const combined = [...baseImages, ...arr].slice(0, 10);
    setBaseImages(combined);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
  }

  function removeImage(i: number) {
    const next = baseImages.filter((_, idx) => idx !== i);
    setBaseImages(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  }

  function goToStep2(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.slug || !form.display_name) return setError('Slug and display name are required');
    setStep(2);
  }

  async function submit() {
    setError('');
    if (baseImages.length === 0) return setError('Upload at least one base image');
    setLoading(true);
    try {
      const acc = await api.accounts.create(form, baseImages);
      onCreated(acc);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card p-6 w-full max-w-lg animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-5">
          {([1, 2] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? 'bg-indigo-600 text-white'
                  : step > s
                  ? 'bg-indigo-900 text-indigo-300'
                  : 'bg-bg-border text-gray-600'
              }`}>
                {s}
              </div>
              {s < 2 && <div className={`w-8 h-px ${step > s ? 'bg-indigo-600' : 'bg-bg-border'}`} />}
            </div>
          ))}
          <span className="ml-2 text-sm text-gray-400">
            {step === 1 ? 'Account Info' : 'Character Base Images'}
          </span>
        </div>

        {/* ── Step 1: Account info ── */}
        {step === 1 && (
          <form onSubmit={goToStep2} className="space-y-3">
            <div>
              <h2 className="text-white font-semibold text-lg mb-1">New Influencer Account</h2>
              <p className="text-gray-500 text-xs mb-3">
                Basic identity. You&apos;ll upload the character&apos;s base photos next.
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Slug <span className="text-gray-600">(URL-safe, e.g. aria-aesthetic)</span>
              </label>
              <input
                className="input"
                value={form.slug}
                onChange={(e) => setField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                placeholder="aria-aesthetic"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Display Name</label>
              <input
                className="input"
                value={form.display_name}
                onChange={(e) => setField('display_name', e.target.value)}
                placeholder="Aria"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Instagram Handle <span className="text-gray-600">(optional)</span>
              </label>
              <input
                className="input"
                value={form.instagram_handle}
                onChange={(e) => setField('instagram_handle', e.target.value.replace('@', ''))}
                placeholder="aria.aesthetic"
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">Next →</button>
            </div>
          </form>
        )}

        {/* ── Step 2: Base images ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-white font-semibold text-lg mb-1">Character Base Images</h2>
              <p className="text-gray-500 text-xs leading-relaxed">
                These are the <span className="text-indigo-300 font-medium">permanent identity</span> of{' '}
                <span className="text-white font-medium">{form.display_name}</span>.
                Upload 3–10 clear photos showing her face, body and style from multiple angles.
                Every pipeline run will use these as the base for AI generation.
              </p>
            </div>

            {/* Drop zone */}
            <label
              className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-indigo-400 bg-indigo-600/10'
                  : baseImages.length > 0
                  ? 'border-indigo-500/40 bg-indigo-600/5'
                  : 'border-bg-border hover:border-indigo-500/40 hover:bg-indigo-600/5'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            >
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => addFiles(e.target.files!)}
              />
              <div className="text-2xl mb-1">🖼</div>
              <p className="text-sm text-gray-400">
                Drop photos here or <span className="text-indigo-400">click to browse</span>
              </p>
              <p className="text-xs text-gray-600 mt-1">JPG · PNG · WebP — max 30 MB each · up to 10 photos</p>
            </label>

            {/* Thumbnail grid */}
            {previews.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className="relative group aspect-square rounded-lg overflow-hidden bg-bg-base border border-bg-border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-lg font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {/* Add more slot */}
                {baseImages.length < 10 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-bg-border hover:border-indigo-500/40 flex items-center justify-center cursor-pointer text-gray-600 hover:text-indigo-400 transition-colors">
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => addFiles(e.target.files!)} />
                    <span className="text-xl">+</span>
                  </label>
                )}
              </div>
            )}

            <p className="text-xs text-gray-600">
              {baseImages.length === 0
                ? 'No photos selected yet — at least 1 required'
                : `${baseImages.length} / 10 photos selected`}
            </p>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button onClick={() => { setStep(1); setError(''); }} className="btn-ghost flex-1">
                ← Back
              </button>
              <button
                onClick={submit}
                disabled={loading || baseImages.length === 0}
                className="btn-primary flex-1"
              >
                {loading ? 'Creating…' : `Create ${form.display_name}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
