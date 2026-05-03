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

// ── Add Account Modal ─────────────────────────────────────────────────────────
function AddAccountModal({ onClose, onCreated }: { onClose: () => void; onCreated: (acc: Account) => void }) {
  const [form, setForm] = useState({ slug: '', display_name: '', instagram_handle: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.slug || !form.display_name) return setError('Slug and display name are required');
    setLoading(true);
    try {
      const acc = await api.accounts.create(form);
      onCreated(acc);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-white font-semibold text-lg mb-4">Add Influencer Account</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Slug <span className="text-gray-600">(URL-safe, e.g. aria-aesthetic)</span></label>
            <input className="input" value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))} placeholder="aria-aesthetic" required />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Display Name</label>
            <input className="input" value={form.display_name} onChange={(e) => set('display_name', e.target.value)} placeholder="Aria" required />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Instagram Handle <span className="text-gray-600">(optional)</span></label>
            <input className="input" value={form.instagram_handle} onChange={(e) => set('instagram_handle', e.target.value.replace('@', ''))} placeholder="aria.aesthetic" />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
