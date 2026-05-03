import type { Account, Run, Post, StatsData, PersonaProfile } from './store';

// Browser always routes through the Next.js Route Handler proxy at /api/*.
// Server-side (SSR) uses API_URL directly (runtime env var, never reaches browser bundle).
const BASE_URL =
  typeof window !== 'undefined'
    ? ''
    : (process.env.API_URL || `http://localhost:${process.env.PORT_API || 3001}`);

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'API request failed');
  return json.data as T;
}

// ── Accounts ──────────────────────────────────────────────────────────────────
export const api = {
  accounts: {
    list: () => req<Account[]>('/api/accounts'),

    get: (slug: string) => req<Account>(`/api/accounts/${slug}`),

    create: (fields: {
      slug: string;
      display_name: string;
      instagram_handle?: string;
      persona_profile?: PersonaProfile;
    }, baseImages: File[]) => {
      const fd = new FormData();
      fd.append('slug', fields.slug);
      fd.append('display_name', fields.display_name);
      if (fields.instagram_handle) fd.append('instagram_handle', fields.instagram_handle);
      if (fields.persona_profile) fd.append('persona_profile', JSON.stringify(fields.persona_profile));
      baseImages.forEach((f) => fd.append('base_images', f));
      return fetch(`${BASE_URL}/api/accounts`, { method: 'POST', body: fd })
        .then(async (res) => {
          const json = await res.json();
          if (!json.success) throw new Error(json.error || 'API request failed');
          return json.data as Account;
        });
    },

    update: (slug: string, updates: Partial<Account>) =>
      req<Account>(`/api/accounts/${slug}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),

    testCredentials: (slug: string, service: string) =>
      req<{ service: string; status: string; message: string }>(
        `/api/accounts/${slug}/test-credentials`,
        { method: 'POST', body: JSON.stringify({ service }) }
      ),
  },

  // ── Runs ────────────────────────────────────────────────────────────────────
  runs: {
    trigger: (slug: string, formData: FormData) =>
      fetch(`${BASE_URL}/api/accounts/${slug}/run`, {
        method: 'POST',
        body: formData, // multipart — do NOT set Content-Type
      }).then(async (res) => {
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data as { run_id: string; status: string };
      }),

    list: (slug: string, params?: { status?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      return fetch(`${BASE_URL}/api/accounts/${slug}/runs?${qs}`)
        .then((r) => r.json())
        .then((j) => ({ data: j.data as Run[], meta: j.meta }));
    },

    get: (slug: string, id: string) => req<Run>(`/api/accounts/${slug}/runs/${id}`),
  },

  // ── Posts ───────────────────────────────────────────────────────────────────
  posts: {
    list: (slug: string, params?: { page?: number; limit?: number; sort?: string; order?: string }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.sort) qs.set('sort', params.sort);
      if (params?.order) qs.set('order', params.order);
      return fetch(`${BASE_URL}/api/accounts/${slug}/posts?${qs}`)
        .then((r) => r.json())
        .then((j) => ({ data: j.data as Post[], meta: j.meta }));
    },

    stats: (slug: string) => req<StatsData>(`/api/accounts/${slug}/stats`),
  },

  // ── Drive ────────────────────────────────────────────────────────────────────
  drive: {
    list: (folderUrl: string) =>
      req<{ folder_id: string; files: unknown[] }>(`/api/drive/list?folder=${encodeURIComponent(folderUrl)}`),
  },
};

// ── SSE helper ────────────────────────────────────────────────────────────────
export interface LogEvent {
  agent: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export function subscribeToRunLogs(
  slug: string,
  runId: string,
  onEvent: (event: LogEvent) => void,
  onError?: (err: Event) => void
): () => void {
  const es = new EventSource(`${BASE_URL}/api/accounts/${slug}/runs/${runId}/stream`);

  es.onmessage = (e) => {
    if (!e.data || e.data.startsWith(':')) return;
    try {
      const parsed = JSON.parse(e.data) as LogEvent;
      onEvent(parsed);
    } catch {
      // ignore parse errors (heartbeats etc.)
    }
  };

  if (onError) es.onerror = onError;

  return () => es.close();
}
