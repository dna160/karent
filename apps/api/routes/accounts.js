const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const { prisma } = require('../db/index');
const { createTenantSchema } = require('../db/tenant');
const { loadAccounts, ACCOUNTS_DIR } = require('../lib/config-loader');
const { startPipelineProcessors } = require('../queue/pipeline');

// ── Multer storage for base images ────────────────────────────────────────────
// Files land in config/accounts/{slug}/base/ — slug comes from req.body.slug
// We use a factory so the destination is determined from the request body.
const baseImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // slug already validated/sanitised in the route handler before multer runs,
    // but multer calls destination before the route body runs, so we rely on
    // the raw body field being available via busboy parsing order (text fields
    // arrive before files in standard multipart uploads).
    const slug = (req.body.slug || '').toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!slug) return cb(new Error('slug is required before uploading base images'));
    const dest = path.join(ACCOUNTS_DIR, slug, 'base');
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `base-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`);
  },
});

const uploadBase = multer({
  storage: baseImageStorage,
  limits: { files: 10, fileSize: 30 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, and WebP files are allowed'));
  },
});

// Helper: get stored base image filenames for a slug
function getBaseImageFilenames(slug) {
  const baseDir = path.join(ACCOUNTS_DIR, slug, 'base');
  if (!fs.existsSync(baseDir)) return [];
  return fs.readdirSync(baseDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
}

// Helper: get full absolute paths to base images
function getBaseImagePaths(slug) {
  const baseDir = path.join(ACCOUNTS_DIR, slug, 'base');
  return getBaseImageFilenames(slug).map((f) => path.join(baseDir, f));
}

// ── GET /api/accounts ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const dbAccounts = await prisma.influencer.findMany({ orderBy: { created_at: 'desc' } });
    const configAccounts = loadAccounts();

    const merged = dbAccounts.map((acc) => {
      const cfg = configAccounts.find((c) => c.slug === acc.slug) || {};
      const baseImages = getBaseImageFilenames(acc.slug);
      return {
        ...acc,
        base_image_urls: baseImages.map((f) => `/api/accounts/${acc.slug}/base-images/${f}`),
        credentials: {
          gemini: !!(cfg.google_email && cfg.google_password),
          canva: !!(cfg.canva_email && cfg.canva_password),
          instagram: !!(cfg.instagram_username && cfg.instagram_password),
          drive: !!(cfg.drive_folder_id),
        },
      };
    });

    res.json({ success: true, data: merged });
  } catch (err) {
    console.error('[accounts] GET /:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/accounts  (multipart/form-data) ─────────────────────────────────
// Fields: slug, display_name, instagram_handle (optional)
// Files:  base_images[] — required, 1-10 JPG/PNG/WebP
router.post('/', uploadBase.array('base_images', 10), async (req, res) => {
  const { slug, display_name, instagram_handle, persona_profile } = req.body;

  if (!slug || !display_name) {
    return res.status(400).json({ success: false, error: 'slug and display_name are required' });
  }
  if (!/^[a-z0-9-_]+$/.test(slug)) {
    return res.status(400).json({
      success: false,
      error: 'slug must be lowercase alphanumeric with hyphens/underscores only',
    });
  }
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, error: 'At least one base image is required' });
  }

  try {
    const existing = await prisma.influencer.findUnique({ where: { slug } });
    if (existing) {
      // Clean up uploaded files before returning error
      req.files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
      return res.status(409).json({ success: false, error: 'Account with this slug already exists' });
    }

    const baseImagePaths = req.files.map((f) => f.path);

    let parsedPersona;
    try {
      parsedPersona = persona_profile
        ? (typeof persona_profile === 'string' ? JSON.parse(persona_profile) : persona_profile)
        : getDefaultPersonaProfile(slug);
    } catch {
      parsedPersona = getDefaultPersonaProfile(slug);
    }

    // Create DB record
    const influencer = await prisma.influencer.create({
      data: {
        slug,
        display_name,
        instagram_handle: instagram_handle || null,
        persona_profile: parsedPersona,
        base_image_paths: baseImagePaths,
      },
    });

    // Create per-tenant schema (runs + posts tables)
    await createTenantSchema(influencer.id);

    // Create config directory and .env placeholder
    const accountDir = path.join(ACCOUNTS_DIR, slug);
    fs.mkdirSync(accountDir, { recursive: true });
    const envExampleSrc = path.join(process.cwd(), 'config', 'accounts', 'example-account', '.env.example');
    const envDest = path.join(accountDir, '.env.example');
    if (fs.existsSync(envExampleSrc)) {
      let content = fs.readFileSync(envExampleSrc, 'utf8');
      content = content.replace(/ACCOUNT_SLUG/g, slug);
      fs.writeFileSync(envDest, content);
    }

    // Start pipeline processor for new account
    startPipelineProcessors(slug);

    console.log(`[accounts] Created: ${slug} with ${baseImagePaths.length} base image(s)`);

    res.status(201).json({
      success: true,
      data: {
        ...influencer,
        base_image_urls: baseImagePaths.map((p) => {
          const f = path.basename(p);
          return `/api/accounts/${slug}/base-images/${f}`;
        }),
      },
    });
  } catch (err) {
    console.error('[accounts] POST /:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/accounts/:slug ───────────────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  try {
    const influencer = await prisma.influencer.findUnique({ where: { slug: req.params.slug } });
    if (!influencer) return res.status(404).json({ success: false, error: 'Account not found' });

    const cfgAccounts = loadAccounts();
    const cfg = cfgAccounts.find((c) => c.slug === req.params.slug) || {};
    const baseImages = getBaseImageFilenames(req.params.slug);

    res.json({
      success: true,
      data: {
        ...influencer,
        base_image_urls: baseImages.map((f) => `/api/accounts/${req.params.slug}/base-images/${f}`),
        credentials: {
          gemini: !!(cfg.google_email && cfg.google_password),
          canva: !!(cfg.canva_email && cfg.canva_password),
          instagram: !!(cfg.instagram_username && cfg.instagram_password),
          drive: !!(cfg.drive_folder_id),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/accounts/:slug/base-images/:filename  (serve image file) ─────────
router.get('/:slug/base-images/:filename', (req, res) => {
  const { slug, filename } = req.params;
  // Sanitise filename — no path traversal
  const safe = path.basename(filename);
  const filePath = path.join(ACCOUNTS_DIR, slug, 'base', safe);
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: 'Image not found' });
  res.sendFile(filePath);
});

// ── POST /api/accounts/:slug/base-images  (add more base images) ───────────────
router.post('/:slug/base-images', (req, res, next) => {
  // Patch req.body.slug so the multer storage destination works
  req.body = req.body || {};
  req.body.slug = req.params.slug;
  next();
}, uploadBase.array('base_images', 10), async (req, res) => {
  const { slug } = req.params;
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, error: 'No images provided' });
  }
  try {
    const influencer = await prisma.influencer.findUnique({ where: { slug } });
    if (!influencer) return res.status(404).json({ success: false, error: 'Account not found' });

    const newPaths = req.files.map((f) => f.path);
    const allPaths = [...(influencer.base_image_paths || []), ...newPaths];

    await prisma.influencer.update({
      where: { slug },
      data: { base_image_paths: allPaths, updated_at: new Date() },
    });

    res.json({
      success: true,
      data: {
        added: newPaths.length,
        base_image_urls: allPaths.map((p) => `/api/accounts/${slug}/base-images/${path.basename(p)}`),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/accounts/:slug/base-images/:filename ──────────────────────────
router.delete('/:slug/base-images/:filename', async (req, res) => {
  const { slug, filename } = req.params;
  const safe = path.basename(filename);
  const filePath = path.join(ACCOUNTS_DIR, slug, 'base', safe);

  try {
    const influencer = await prisma.influencer.findUnique({ where: { slug } });
    if (!influencer) return res.status(404).json({ success: false, error: 'Account not found' });

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const remaining = (influencer.base_image_paths || []).filter((p) => path.basename(p) !== safe);
    await prisma.influencer.update({
      where: { slug },
      data: { base_image_paths: remaining, updated_at: new Date() },
    });

    res.json({ success: true, data: { remaining: remaining.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/accounts/:slug ───────────────────────────────────────────────────
router.put('/:slug', async (req, res) => {
  const allowed = ['display_name', 'persona_profile', 'instagram_handle', 'avatar_url', 'status'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, error: 'No valid fields to update' });
  }
  try {
    const influencer = await prisma.influencer.update({
      where: { slug: req.params.slug },
      data: { ...updates, updated_at: new Date() },
    });
    res.json({ success: true, data: influencer });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Account not found' });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/accounts/:slug/test-credentials ────────────────────────────────
router.post('/:slug/test-credentials', async (req, res) => {
  const { service } = req.body;
  const validServices = ['gemini', 'canva', 'instagram', 'drive'];
  if (!validServices.includes(service)) {
    return res.status(400).json({ success: false, error: `Invalid service. Must be one of: ${validServices.join(', ')}` });
  }
  res.json({
    success: true,
    data: { service, status: 'stub', message: 'Credential test not yet implemented.' },
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDefaultPersonaProfile(slug) {
  return {
    name: slug,
    age: 23,
    aesthetic: 'minimalist lifestyle',
    personality_tags: ['dreamy', 'aesthetic', 'wellness-focused'],
    caption_voice: 'casual and aspirational',
    hashtag_niches: ['slowliving', 'minimalstyle', 'softlife'],
    hashtag_viral: ['aesthetic', 'lifestyle', 'inspo', 'photooftheday'],
    preferred_settings: ['cafe', 'home', 'outdoors'],
    color_palette: 'warm neutrals, soft beige',
    bio: 'chasing golden hours ✨',
  };
}

module.exports = router;
module.exports.getBaseImagePaths = getBaseImagePaths;
