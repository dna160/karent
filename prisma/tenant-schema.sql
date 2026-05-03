-- Tenant schema setup for a single influencer account.
-- {schema_name} is replaced at runtime with schema_{influencer_id} (dashes → underscores).
-- This file is executed by apps/api/db/tenant.js when a new account is created.

CREATE SCHEMA IF NOT EXISTS {schema_name};

-- ─── runs ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS {schema_name}.runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','running','completed','failed','review')),
  post_type       VARCHAR(10) NOT NULL DEFAULT 'feed'
                    CHECK (post_type IN ('feed','story','both')),
  pose_ref_url    TEXT,
  pose_json       JSONB,
  raw_image_path  TEXT,
  clean_image_url TEXT,
  caption         TEXT,
  selected_song   JSONB,
  ig_feed_url     TEXT,
  ig_story_id     TEXT,
  agent_log       JSONB[] NOT NULL DEFAULT '{}',
  error_code      VARCHAR(50),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- ─── posts ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS {schema_name}.posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      UUID NOT NULL REFERENCES {schema_name}.runs(id) ON DELETE CASCADE,
  type        VARCHAR(10) NOT NULL CHECK (type IN ('feed','story')),
  platform_id TEXT,
  permalink   TEXT,
  image_url   TEXT,
  caption     TEXT,
  song        JSONB,
  posted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  likes       INTEGER NOT NULL DEFAULT 0,
  comments    INTEGER NOT NULL DEFAULT 0,
  reach       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_{schema_name}_runs_status ON {schema_name}.runs(status);
CREATE INDEX IF NOT EXISTS idx_{schema_name}_runs_created ON {schema_name}.runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_{schema_name}_posts_posted ON {schema_name}.posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_{schema_name}_posts_run ON {schema_name}.posts(run_id);
