# Karent — PERSONA ENGINE

AI influencer content automation pipeline. Produces, cleans, and publishes AI-generated
lifestyle content to Instagram on behalf of synthetic influencer personas.

---

## Architecture

```
Operator → Dashboard (Next.js :3000)
               ↓
           API Server (Express :3001)
               ↓
           Bull Queue (Redis)
               ↓
    ┌──────────────────────────┐
    │  Agent 1 — Foundation    │  Validates inputs, stubs Drive pose ref
    │  Agent 2 — Layer (STUB)  │  Playwright → Gemini image gen
    │  Agent 3 — Cleanup (STUB)│  Playwright → Canva watermark removal
    │  Agent 4 — Finishing (STUB) │  Playwright → Gemini caption + Instagram post
    └──────────────────────────┘
               ↓
         PostgreSQL (multi-tenant schemas)
         Redis pub/sub → SSE → Dashboard live log
```

---

## Quick Start

### 1. Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Docker Desktop** — [docker.com](https://www.docker.com/products/docker-desktop)
- **npm 9+** (comes with Node 18)

### 2. Clone and install

```bash
git clone <repo-url>
cd karent
npm install
```

### 3. Start infrastructure (Postgres + Redis)

```bash
docker-compose up -d
```

Verify containers are running:
```bash
docker ps
# Should show karent_postgres and karent_redis
```

### 4. Configure environment

```bash
# Root .env
copy .env.example .env
# Edit .env — the defaults match docker-compose.yml, no changes needed for local dev
```

### 5. Run database migrations

```bash
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Create tables (name the migration: init)
```

### 6. Start development servers

```bash
npm run dev
```

- Dashboard: [http://localhost:3000](http://localhost:3000)
- API:       [http://localhost:3001](http://localhost:3001)
- Health:    [http://localhost:3001/health](http://localhost:3001/health)

---

## Adding an Influencer Account

### Option A — Via the Dashboard

1. Open the dashboard at [localhost:3000](http://localhost:3000)
2. Click **+ Add Account** in the sidebar
3. Fill in slug, display name, and Instagram handle
4. The account is created in the database + a config directory is scaffolded

### Option B — Via the API

```bash
curl -X POST http://localhost:3001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"slug":"aria-aesthetic","display_name":"Aria","instagram_handle":"aria.aesthetic"}'
```

### After creating an account

1. Copy the credential template:
   ```
   config/accounts/YOUR_SLUG/.env.example → config/accounts/YOUR_SLUG/.env
   ```
2. Fill in your credentials (see below)
3. Restart the API server

---

## Environment Variables Reference

### Root `.env` (project-wide)

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://karent:karent@localhost:5432/karent` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `PORT_API` | Express API port | `3001` |
| `PORT_DASHBOARD` | Next.js dashboard port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Path to Google service account key | `./config/google-service-account.json` |

### Per-account `config/accounts/SLUG/.env`

| Variable | Activates | Description |
|---|---|---|
| `INFLUENCER_SLUG` | — | Must match directory name |
| `GOOGLE_EMAIL` | Agent 2 | Gmail address for Gemini login |
| `GOOGLE_PASSWORD` | Agent 2 | Gmail password (use App Password if 2FA enabled) |
| `CANVA_EMAIL` | Agent 3 | Canva account email (Pro required) |
| `CANVA_PASSWORD` | Agent 3 | Canva account password |
| `INSTAGRAM_USERNAME` | Agent 4 | Instagram username (no @) |
| `INSTAGRAM_PASSWORD` | Agent 4 | Instagram password |
| `GOOGLE_DRIVE_FOLDER_ID` | Agent 3 + 1 | Drive output folder ID |
| `GOOGLE_DRIVE_POSE_FOLDER_ID` | Agent 1 | Drive pose reference folder ID |
| `BROWSER_STATE_PATH` | All agents | Playwright cookie store (auto-created) |

---

## Activating Agent Stubs

Each agent is currently a stub that logs and passes through. Set the corresponding
credentials in the account `.env` to unlock it.

### Agent 2 — Gemini Image Generation
```
GOOGLE_EMAIL=...
GOOGLE_PASSWORD=...
```
The agent uses **Playwright (headed Chromium)** to:
1. Login to `gemini.google.com` (browser state saved for session reuse)
2. Upload the pose reference image, prompt for a JSON pose descriptor
3. Open a new chat, upload persona reference images, generate the composite image
4. Download the result to `tmp/{run_id}/raw_generated.jpg`

> **2FA note**: If your Google account has 2FA enabled, you must create a Google App Password:
> [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
> → Select app: **Other (Karent)** → Generate → use that password in `.env`

### Agent 3 — Canva Watermark Removal
```
CANVA_EMAIL=...
CANVA_PASSWORD=...
```
Requires **Canva Pro** (Magic Eraser is a Pro feature).
The agent uses Playwright to upload the image, paint over the Gemini watermark
(bottom-right 15%×8% region), export a clean PNG at 1080×1350, and upload to Drive.

### Agent 4 — Caption + Instagram Posting
```
INSTAGRAM_USERNAME=...
INSTAGRAM_PASSWORD=...
```
Uses Playwright for both:
- **Caption generation**: Navigates to `gemini.google.com`, sends the persona-aware
  caption prompt, extracts the result
- **Instagram posting**: Uploads to feed (4:5 crop) and/or story (with song sticker)

### Google Drive Integration
```
# In root .env:
GOOGLE_SERVICE_ACCOUNT_JSON=./config/google-service-account.json

# In account .env:
GOOGLE_DRIVE_FOLDER_ID=...
GOOGLE_DRIVE_POSE_FOLDER_ID=...
```
To get a service account JSON:
1. [console.cloud.google.com](https://console.cloud.google.com) → Select project
2. Enable **Google Drive API**
3. IAM & Admin → Service Accounts → Create → Download JSON key
4. Save as `config/google-service-account.json`
5. Share your Drive folders with the service account's email address

---

## Persona Profile Schema

Every influencer has a `persona_profile` JSON stored in the database.
This drives image generation prompts and caption tone.

```json
{
  "name": "Aria",
  "age": 23,
  "aesthetic": "soft girl / coastal grandmother",
  "personality_tags": ["dreamy", "minimalist", "wellness-focused"],
  "caption_voice": "casual and aspirational",
  "hashtag_niches": ["slowliving", "minimalstyle", "softlife"],
  "hashtag_viral": ["aesthetic", "lifestyle", "inspo", "photooftheday"],
  "preferred_settings": ["cafe", "beach", "home studio"],
  "color_palette": "warm neutrals, sage green, dusty rose",
  "bio": "chasing golden hours & quiet mornings ✨"
}
```

Edit this in the dashboard under **Settings → Persona Profile**.

---

## Project Structure

```
karent/
├── apps/
│   ├── dashboard/          Next.js 14 (port 3000)
│   │   ├── app/            Pages (layout, overview, analytics, run, history, settings)
│   │   ├── components/     Sidebar, charts, forms, drawers
│   │   └── lib/            api.ts (typed fetch client), store.ts (Zustand)
│   └── api/                Express API (port 3001)
│       ├── agents/         agent1 (full) + agent2-4 (stubs)
│       ├── db/             Prisma client + tenant schema helpers
│       ├── queue/          Bull queue setup + pipeline processor
│       ├── routes/         accounts, runs, posts, drive
│       └── lib/            config-loader (reads config/accounts/)
├── config/
│   └── accounts/           One directory per influencer slug
│       └── SLUG/
│           ├── .env        Credentials (gitignored)
│           └── browser-state.json   Playwright sessions (gitignored)
├── prisma/
│   ├── schema.prisma       Public schema (influencers table)
│   └── tenant-schema.sql   Per-influencer runs + posts tables
├── tmp/                    Runtime temp files (gitignored)
├── docker-compose.yml      Postgres 15 + Redis 7
└── .env                    Global config (gitignored)
```

---

## Database Design

- **Public schema**: `influencers` table (shared, managed by Prisma)
- **Per-tenant schemas**: `schema_{influencer_id}` containing `runs` and `posts`
  - Created automatically when a new account is added
  - Isolated: adding accounts never requires schema migrations on existing data
  - Queried via `SET LOCAL search_path` inside transactions

---

## Implementation Phases

| Phase | Status | Description |
|---|---|---|
| P0 | ✅ Complete | Monorepo, Docker, Prisma, .env setup |
| P1 | ✅ Complete | Agent 1 (full), Bull queue, Redis pub/sub |
| P2 | 🔲 Stub | Agent 2 — Gemini Playwright image gen |
| P3 | 🔲 Stub | Agent 3 — Canva Playwright watermark removal |
| P4 | 🔲 Stub | Agent 4 — Caption gen + Instagram posting |
| P5 | ✅ Complete | Full Next.js dashboard (all 5 views) |
| P6 | 🔲 Pending | Error hardening, retries, cleanup jobs |

---

## Known Risks

| Risk | Severity | Notes |
|---|---|---|
| Gemini UI changes break Agent 2 selectors | HIGH | Use aria-labels, add selector health check |
| Instagram detects automation | HIGH | Headed mode + random delays (800ms–3s) built in |
| Canva Magic Eraser location changes | MEDIUM | Fallback: export as-is + flag NEEDS_REVIEW |
| Google 2FA blocks login | MEDIUM | Use App Passwords (documented above) |
| Playwright requires display on headless server | MEDIUM | Use Xvfb on Linux; headed mode is native on Windows |
