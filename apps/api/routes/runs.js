const express = require('express');
const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Redis = require('ioredis');
const router = express.Router({ mergeParams: true });
const { prisma } = require('../db/index');
const { tenantQuery, tenantExecute, schemaName } = require('../db/tenant');
const { getPipelineQueue } = require('../queue/index');
const { ACCOUNTS_DIR } = require('../lib/config-loader');

// Dynamic multer storage: puts files in os.tmpdir()/karent/{run_id}/references/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const runId = req.runId || (req.runId = uuidv4());
    const dest = path.join(os.tmpdir(), 'karent', runId, 'references');
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
  },
});

const upload = multer({
  storage,
  limits: { files: 5, fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG and PNG files are allowed'));
  },
});

// POST /api/accounts/:slug/run
router.post('/:slug/run', upload.array('reference_images', 5), async (req, res) => {
  const { slug } = req.params;
  const { post_type, caption_hint, drive_pose_folder_id, persona_profile } = req.body;

  if (!post_type) {
    return res.status(400).json({ success: false, error: 'post_type is required (feed | story | both)' });
  }

  try {
    const influencer = await prisma.influencer.findUnique({ where: { slug } });
    if (!influencer) return res.status(404).json({ success: false, error: 'Account not found' });

    // Reference images: use uploaded files, or fall back to account base images
    let reference_image_paths = req.files ? req.files.map((f) => f.path) : [];

    if (reference_image_paths.length === 0) {
      // Fall back to base images stored at account creation
      const storedPaths = (influencer.base_image_paths || []).filter((p) => fs.existsSync(p));
      if (storedPaths.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No reference images provided and no base images found for this account. Upload base images first.',
        });
      }
      reference_image_paths = storedPaths;
    }

    const run_id = req.runId || uuidv4();

    let parsedPersona = influencer.persona_profile;
    if (persona_profile) {
      try { parsedPersona = typeof persona_profile === 'string' ? JSON.parse(persona_profile) : persona_profile; }
      catch { /* use account default */ }
    }

    // Create run record in tenant schema
    await tenantExecute(influencer.id,
      `INSERT INTO runs (id, status, post_type) VALUES ($1, 'pending', $2)`,
      [run_id, post_type]
    );

    // Enqueue Agent 1
    const queue = getPipelineQueue(slug);
    await queue.add({
      currentAgent: 1,
      run_id,
      influencer_id: influencer.id,
      slug,
      reference_image_paths,
      persona_profile: parsedPersona,
      post_type,
      caption_hint: caption_hint || null,
      drive_pose_folder_id: drive_pose_folder_id || influencer.persona_profile?.drive_pose_folder_id || null,
    });

    res.status(202).json({ success: true, data: { run_id, status: 'pending' } });
  } catch (err) {
    console.error('[runs] POST run:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/accounts/:slug/runs
router.get('/:slug/runs', async (req, res) => {
  const { slug } = req.params;
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    const influencer = await prisma.influencer.findUnique({ where: { slug } });
    if (!influencer) return res.status(404).json({ success: false, error: 'Account not found' });

    const schema = schemaName(influencer.id);
    let where = '';
    const params = [Number(limit), offset];

    if (status && status !== 'all') {
      where = `WHERE status = $3`;
      params.push(status);
    }

    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, status, post_type, clean_image_url, caption, created_at, completed_at,
              error_code, ig_feed_url, ig_story_id
       FROM "${schema}".runs ${where}
       ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      ...params
    );

    const [{ count }] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "${schema}".runs ${status && status !== 'all' ? `WHERE status = '${status}'` : ''}`
    );

    res.json({ success: true, data: rows, meta: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error('[runs] GET runs:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/accounts/:slug/runs/:id
router.get('/:slug/runs/:id', async (req, res) => {
  const { slug, id } = req.params;
  try {
    const influencer = await prisma.influencer.findUnique({ where: { slug } });
    if (!influencer) return res.status(404).json({ success: false, error: 'Account not found' });

    const schema = schemaName(influencer.id);
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "${schema}".runs WHERE id = $1`, id
    );

    if (!rows.length) return res.status(404).json({ success: false, error: 'Run not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/accounts/:slug/runs/:id/stream  — SSE live log
router.get('/:slug/runs/:id/stream', async (req, res) => {
  const { slug, id: runId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send a heartbeat immediately so the browser knows the connection is live
  res.write(': connected\n\n');

  const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  const channel = `run:${runId}:logs`;

  subscriber.subscribe(channel, (err) => {
    if (err) {
      res.write(`data: ${JSON.stringify({ level: 'error', message: 'Failed to subscribe to log stream' })}\n\n`);
      res.end();
    }
  });

  subscriber.on('message', (ch, message) => {
    res.write(`data: ${message}\n\n`);
  });

  // Heartbeat every 15s to keep connection alive through proxies
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    subscriber.unsubscribe(channel);
    subscriber.quit();
  });
});

module.exports = router;
