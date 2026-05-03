const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { prisma } = require('../db/index');
const { createTenantSchema } = require('../db/tenant');
const { loadAccounts, ACCOUNTS_DIR } = require('../lib/config-loader');
const { startPipelineProcessors } = require('../queue/pipeline');

// GET /api/accounts
router.get('/', async (req, res) => {
  try {
    const dbAccounts = await prisma.influencer.findMany({
      orderBy: { created_at: 'desc' },
    });
    const configAccounts = loadAccounts();

    // Merge: DB is the source of truth, config provides credential status
    const merged = dbAccounts.map((acc) => {
      const cfg = configAccounts.find((c) => c.slug === acc.slug) || {};
      return {
        ...acc,
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

// POST /api/accounts
router.post('/', async (req, res) => {
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

  try {
    const existing = await prisma.influencer.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Account with this slug already exists' });
    }

    // Create DB record
    const influencer = await prisma.influencer.create({
      data: {
        slug,
        display_name,
        instagram_handle: instagram_handle || null,
        persona_profile: persona_profile || getDefaultPersonaProfile(slug),
      },
    });

    // Create tenant schema in Postgres
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

    res.status(201).json({ success: true, data: influencer });
  } catch (err) {
    console.error('[accounts] POST /:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/accounts/:slug
router.get('/:slug', async (req, res) => {
  try {
    const influencer = await prisma.influencer.findUnique({
      where: { slug: req.params.slug },
    });
    if (!influencer) return res.status(404).json({ success: false, error: 'Account not found' });

    const cfgAccounts = loadAccounts();
    const cfg = cfgAccounts.find((c) => c.slug === req.params.slug) || {};

    res.json({
      success: true,
      data: {
        ...influencer,
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

// PUT /api/accounts/:slug
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

// POST /api/accounts/:slug/test-credentials
router.post('/:slug/test-credentials', async (req, res) => {
  // STUB — full implementation runs a headless Playwright login check per service
  const { service } = req.body;
  const validServices = ['gemini', 'canva', 'instagram', 'drive'];
  if (!validServices.includes(service)) {
    return res.status(400).json({ success: false, error: `Invalid service. Must be one of: ${validServices.join(', ')}` });
  }
  res.json({
    success: true,
    data: {
      service,
      status: 'stub',
      message: 'Credential test not yet implemented. Set credentials in account .env file and activate the relevant agent.',
    },
  });
});

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
