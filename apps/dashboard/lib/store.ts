import { create } from 'zustand';

export interface CredentialStatus {
  gemini: boolean;
  canva: boolean;
  instagram: boolean;
  drive: boolean;
}

export interface Account {
  id: string;
  slug: string;
  display_name: string;
  persona_profile: PersonaProfile;
  avatar_url?: string | null;
  instagram_handle?: string | null;
  status: 'active' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
  credentials?: CredentialStatus;
}

export interface PersonaProfile {
  name: string;
  age: number;
  aesthetic: string;
  personality_tags: string[];
  caption_voice: string;
  hashtag_niches: string[];
  hashtag_viral: string[];
  preferred_settings: string[];
  color_palette: string;
  bio: string;
}

export interface Run {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'review';
  post_type: 'feed' | 'story' | 'both';
  pose_ref_url?: string;
  pose_json?: Record<string, string>;
  raw_image_path?: string;
  clean_image_url?: string;
  caption?: string;
  selected_song?: { name: string; artist: string; source_url: string };
  ig_feed_url?: string;
  ig_story_id?: string;
  agent_log?: AgentLogEntry[];
  error_code?: string;
  created_at: string;
  completed_at?: string;
}

export interface AgentLogEntry {
  agent: string;
  started_at: string;
  completed_at?: string;
  status: 'ok' | 'error';
  error?: string;
}

export interface Post {
  id: string;
  run_id: string;
  type: 'feed' | 'story';
  platform_id?: string;
  permalink?: string;
  image_url?: string;
  caption?: string;
  song?: { name: string; artist: string; source_url: string };
  posted_at: string;
  likes: number;
  comments: number;
  reach: number;
}

export interface StatsData {
  posts_this_month: number;
  total_runs: number;
  success_rate: number;
  last_posted_at: string | null;
  last_run_at: string | null;
  weekly_posts: { week_start: string; count: number }[];
  post_type_split: { type: string; count: number }[];
}

interface Store {
  activeAccount: Account | null;
  accounts: Account[];
  setActiveAccount: (account: Account) => void;
  setAccounts: (accounts: Account[]) => void;
  updateAccount: (slug: string, updates: Partial<Account>) => void;
}

export const useStore = create<Store>((set) => ({
  activeAccount: null,
  accounts: [],
  setActiveAccount: (account) => set({ activeAccount: account }),
  setAccounts: (accounts) =>
    set((state) => ({
      accounts,
      activeAccount:
        state.activeAccount
          ? (accounts.find((a) => a.slug === state.activeAccount!.slug) ?? accounts[0] ?? null)
          : (accounts[0] ?? null),
    })),
  updateAccount: (slug, updates) =>
    set((state) => ({
      accounts: state.accounts.map((a) => (a.slug === slug ? { ...a, ...updates } : a)),
      activeAccount:
        state.activeAccount?.slug === slug
          ? { ...state.activeAccount, ...updates }
          : state.activeAccount,
    })),
}));
