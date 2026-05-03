// Load .env from project root (local dev) or fall back to process env (Railway/production)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') }); // fallback

const express = require('express');
const cors = require('cors');
const path = require('path');

const accountsRouter = require('./routes/accounts');
const runsRouter = require('./routes/runs');
const postsRouter = require('./routes/posts');
const driveRouter = require('./routes/drive');

const { loadAccounts } = require('./lib/config-loader');
const { startPipelineProcessors } = require('./queue/pipeline');
const { prisma } = require('./db/index');

const app = express();
const PORT = process.env.PORT || process.env.PORT_API || 3001;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.DASHBOARD_URL
    ? [process.env.DASHBOARD_URL, `http://localhost:${process.env.PORT_DASHBOARD || 3000}`]
    : true, // allow all origins in dev / when DASHBOARD_URL not set
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/accounts', accountsRouter);
app.use('/api/accounts', runsRouter);
app.use('/api/accounts', postsRouter);
app.use('/api/drive', driveRouter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ success: false, error: 'Not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

// ── Startup ────────────────────────────────────────────────────────────────────
async function start() {
  // Test DB connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[db] PostgreSQL connected');
  } catch (err) {
    console.error('[db] Failed to connect to PostgreSQL:', err.message);
    console.error('     Make sure Docker is running: docker-compose up -d');
    process.exit(1);
  }

  // Start pipeline processors for every configured account
  const accounts = loadAccounts();
  if (accounts.length === 0) {
    console.log('[queue] No accounts found in config/accounts/ — skipping queue setup');
  } else {
    for (const acc of accounts) {
      startPipelineProcessors(acc.slug);
    }
    console.log(`[queue] Pipeline processors started for ${accounts.length} account(s)`);
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Karent API running at http://localhost:${PORT}`);
    console.log(`   Dashboard: http://localhost:${process.env.PORT_DASHBOARD || 3000}`);
    console.log(`   Health:    http://localhost:${PORT}/health\n`);
  });
}

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
