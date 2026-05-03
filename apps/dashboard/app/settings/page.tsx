'use client';

import { useState } from 'react';
import { useStore, type PersonaProfile } from '@/lib/store';
import { api } from '@/lib/api';
import { PersonaProfileEditor } from '@/components/settings/PersonaProfileEditor';
import { CredentialStatusPanel } from '@/components/settings/CredentialStatusPanel';

const DEFAULT_CREDS = { gemini: false, canva: false, instagram: false, drive: false };

export default function SettingsPage() {
  const { activeAccount, updateAccount } = useStore();
  const [persona, setPersona] = useState<PersonaProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Initialize persona from active account
  const currentPersona = persona ?? (activeAccount?.persona_profile as PersonaProfile) ?? null;

  async function savePersona() {
    if (!activeAccount || !currentPersona) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.accounts.update(activeAccount.slug, { persona_profile: currentPersona });
      updateAccount(activeAccount.slug, { persona_profile: currentPersona });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function setAccountStatus(status: 'active' | 'paused' | 'archived') {
    if (!activeAccount) return;
    setStatusUpdating(true);
    try {
      await api.accounts.update(activeAccount.slug, { status });
      updateAccount(activeAccount.slug, { status });
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setStatusUpdating(false);
    }
  }

  if (!activeAccount) return <div className="flex items-center justify-center h-screen text-gray-500">Select an account</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">{activeAccount.display_name} · @{activeAccount.instagram_handle || activeAccount.slug}</p>
      </div>

      {/* Credential status */}
      <section>
        <h2 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Credentials</h2>
        <CredentialStatusPanel slug={activeAccount.slug} credentials={activeAccount.credentials ?? DEFAULT_CREDS} />
        <p className="text-xs text-gray-600 mt-2">
          Each credential set activates the corresponding agent. Edit <code className="font-mono text-gray-500">config/accounts/{activeAccount.slug}/.env</code> then restart the API.
        </p>
      </section>

      {/* Persona profile editor */}
      <section>
        <h2 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Persona Profile</h2>
        <div className="card p-5">
          {currentPersona ? (
            <>
              <PersonaProfileEditor profile={currentPersona} onChange={setPersona} />
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-bg-border">
                <button onClick={savePersona} disabled={saving} className="btn-primary">
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
                {saved && <span className="text-green-400 text-sm">✓ Saved</span>}
              </div>
            </>
          ) : (
            <p className="text-gray-600 text-sm">No persona profile found.</p>
          )}
        </div>
      </section>

      {/* Drive settings */}
      <section>
        <h2 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Google Drive</h2>
        <div className="card p-5 space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Output Folder ID <span className="text-gray-600">(GOOGLE_DRIVE_FOLDER_ID in account .env)</span></label>
            <input className="input" readOnly value="Set in config/accounts/" placeholder="Set GOOGLE_DRIVE_FOLDER_ID in account .env" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Pose Reference Folder ID <span className="text-gray-600">(GOOGLE_DRIVE_POSE_FOLDER_ID in account .env)</span></label>
            <input className="input" readOnly placeholder="Set GOOGLE_DRIVE_POSE_FOLDER_ID in account .env" />
          </div>
          <p className="text-xs text-gray-600">Drive integration is currently stubbed. See README for activation steps.</p>
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <h2 className="text-sm font-medium text-red-400/70 mb-3 uppercase tracking-wider">Account Status</h2>
        <div className="card border-red-500/10 p-5">
          <p className="text-sm text-gray-400 mb-4">
            Current status: <span className={`font-medium ${activeAccount.status === 'active' ? 'text-green-400' : activeAccount.status === 'paused' ? 'text-yellow-400' : 'text-gray-500'}`}>{activeAccount.status}</span>
          </p>
          <div className="flex gap-2 flex-wrap">
            {activeAccount.status !== 'paused' && (
              <button disabled={statusUpdating} onClick={() => setAccountStatus('paused')} className="btn-danger text-sm">
                Pause Account
              </button>
            )}
            {activeAccount.status !== 'active' && (
              <button disabled={statusUpdating} onClick={() => setAccountStatus('active')} className="btn-primary text-sm">
                Reactivate
              </button>
            )}
            {activeAccount.status !== 'archived' && (
              <button disabled={statusUpdating} onClick={() => setAccountStatus('archived')} className="btn-danger text-sm">
                Archive Account
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
