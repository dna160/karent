'use client';
import { useState } from 'react';
import clsx from 'clsx';
import type { CredentialStatus } from '@/lib/store';
import { api } from '@/lib/api';

interface ServiceCard {
  key: keyof CredentialStatus;
  label: string;
  envVars: string[];
  agentLabel: string;
}

const SERVICES: ServiceCard[] = [
  { key: 'gemini',    label: 'Gemini',    envVars: ['GOOGLE_EMAIL', 'GOOGLE_PASSWORD'],     agentLabel: 'Agent 2 — Image Generation' },
  { key: 'canva',     label: 'Canva',     envVars: ['CANVA_EMAIL', 'CANVA_PASSWORD'],        agentLabel: 'Agent 3 — Watermark Removal' },
  { key: 'instagram', label: 'Instagram', envVars: ['INSTAGRAM_USERNAME', 'INSTAGRAM_PASSWORD'], agentLabel: 'Agent 4 — Posting' },
  { key: 'drive',     label: 'Drive',     envVars: ['GOOGLE_DRIVE_FOLDER_ID'],               agentLabel: 'Drive Upload & Pose Refs' },
];

interface Props { slug: string; credentials: CredentialStatus }

export function CredentialStatusPanel({ slug, credentials }: Props) {
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string>>({});

  async function test(service: string) {
    setTesting(service);
    try {
      const result = await api.accounts.testCredentials(slug, service);
      setTestResult((prev) => ({ ...prev, [service]: result.message }));
    } catch (err: unknown) {
      setTestResult((prev) => ({ ...prev, [service]: err instanceof Error ? err.message : 'Test failed' }));
    } finally {
      setTesting(null);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {SERVICES.map((svc) => {
        const ok = credentials[svc.key];
        return (
          <div key={svc.key} className={clsx('card p-4', ok ? 'border-green-500/20' : 'border-red-500/20')}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={clsx('text-lg', ok ? 'text-green-400' : 'text-red-400')}>{ok ? '✓' : '✗'}</span>
                  <span className="font-medium text-white text-sm">{svc.label}</span>
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">{svc.agentLabel}</p>
              </div>
              <button
                onClick={() => test(svc.key)}
                disabled={!!testing}
                className="text-xs text-gray-500 hover:text-white border border-bg-border rounded px-2 py-1 transition-colors disabled:opacity-40"
              >
                {testing === svc.key ? 'Testing…' : 'Test'}
              </button>
            </div>
            <div className="space-y-0.5">
              {svc.envVars.map((v) => (
                <p key={v} className="text-[10px] font-mono text-gray-600">{v}</p>
              ))}
            </div>
            {!ok && (
              <p className="text-[10px] text-yellow-500/80 mt-2">
                Set in <code className="font-mono">config/accounts/{slug}/.env</code>
              </p>
            )}
            {testResult[svc.key] && (
              <p className="text-[10px] text-gray-500 mt-2 italic">{testResult[svc.key]}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
