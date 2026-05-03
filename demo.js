/**
 * Karent — Standalone Demo Runner
 * ─────────────────────────────────
 * Runs a complete 4-agent pipeline for a persona WITHOUT needing
 * Postgres, Redis, or Docker. Uses an in-memory store and direct
 * synchronous agent calls.
 *
 * Usage:
 *   node demo.js
 */

require('dotenv').config();
const path = require('path');
const fs   = require('fs');
const os   = require('os');
const { v4: uuidv4 } = require('uuid');

// ── ANSI colours ──────────────────────────────────────────────────────────────
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  indigo:  '\x1b[94m',
};

const AGENT_COLOURS = {
  'agent1-foundation': C.blue,
  'agent2-layer':      C.magenta,
  'agent3-cleanup':    C.yellow,
  'agent4-finishing':  C.green,
};

function log(agent, level, message) {
  const colour    = AGENT_COLOURS[agent] || C.white;
  const lvlColour = level === 'error' ? C.red : level === 'warn' ? C.yellow : C.dim;
  const ts        = new Date().toLocaleTimeString();
  console.log(`${C.dim}${ts}${C.reset}  ${colour}${agent.padEnd(22)}${C.reset}  ${lvlColour}${message}${C.reset}`);
}

function banner(text, colour = C.indigo) {
  const line = '─'.repeat(60);
  console.log(`\n${colour}${line}${C.reset}`);
  console.log(`${colour}${C.bold}  ${text}${C.reset}`);
  console.log(`${colour}${line}${C.reset}\n`);
}

function section(text) {
  console.log(`\n${C.cyan}${C.bold}▶ ${text}${C.reset}`);
}

// ── Melody's Persona ──────────────────────────────────────────────────────────
const MELODY_PERSONA = {
  name:              'Melody',
  age:               22,
  aesthetic:         'dreamy indie / cottagecore',
  personality_tags:  ['whimsical', 'romantic', 'nature-lover', 'bookish', 'soft-spoken'],
  caption_voice:     'poetic and intimate',
  hashtag_niches:    ['cottagecore', 'indiegirl', 'softaesthetic', 'naturegirl', 'bookstagram'],
  hashtag_viral:     ['aesthetic', 'lifestyle', 'dreamy', 'vibes', 'photooftheday', 'inspo'],
  preferred_settings:['meadow', 'forest path', 'cottage window', 'rainy cafe', 'old library'],
  color_palette:     'muted sage, dusty lavender, warm cream, faded rose',
  bio:               'somewhere between a wildflower field and a dog-eared page 🌿📖',
};

// ── In-memory "DB" ────────────────────────────────────────────────────────────
const db = {
  influencer: {
    id:               uuidv4(),
    slug:             'melody',
    display_name:     'Melody',
    persona_profile:  MELODY_PERSONA,
    instagram_handle: 'melody.in.bloom',
    status:           'active',
    created_at:       new Date().toISOString(),
  },
  runs: [],
};

// ── Agent implementations (demo versions) ─────────────────────────────────────

async function runAgent1(ctx) {
  const agent = 'agent1-foundation';
  log(agent, 'info', 'Starting — validating inputs');
  await sleep(300);

  if (!ctx.reference_image_paths || ctx.reference_image_paths.length === 0) {
    log(agent, 'warn', 'No real reference images provided — using demo placeholders');
  }

  // Create real tmp directory structure
  const tmpDir = path.join(os.tmpdir(), 'karent', ctx.run_id);
  const refDir = path.join(tmpDir, 'references');
  fs.mkdirSync(refDir, { recursive: true });

  // Write demo reference image placeholder
  const demoRefPath = path.join(refDir, 'demo-reference.jpg');
  fs.writeFileSync(demoRefPath, 'DEMO_REFERENCE_IMAGE_PLACEHOLDER');
  log(agent, 'info', `Created temp directory: ${tmpDir}`);
  log(agent, 'info', `Written demo reference placeholder: ${path.basename(demoRefPath)}`);
  await sleep(200);

  // Stub Drive
  log(agent, 'info', `DRIVE_STUB: Would list files in folder: ${ctx.drive_pose_folder_id || 'NOT_SET'}`);
  log(agent, 'info', 'DRIVE_STUB: Randomly selecting 1 pose reference from Drive folder');
  await sleep(400);

  const poseRefPath = path.join(tmpDir, 'pose_ref.jpg');
  fs.writeFileSync(poseRefPath, 'DEMO_POSE_REF_PLACEHOLDER');
  log(agent, 'info', `Pose reference saved: ${path.basename(poseRefPath)}`);

  log(agent, 'info', 'Run context built — handing off to Agent 2 ✓');

  return {
    ...ctx,
    reference_image_paths: [demoRefPath],
    pose_ref_path:          poseRefPath,
    tmp_dir:                tmpDir,
    run_context_built_at:   new Date().toISOString(),
  };
}

async function runAgent2(ctx) {
  const agent = 'agent2-layer';
  log(agent, 'info', '─── Gemini Image Generation ───');
  await sleep(300);
  log(agent, 'info', 'NOT YET ACTIVE — activate by setting GOOGLE_EMAIL + GOOGLE_PASSWORD');
  log(agent, 'info', 'STUB: What would happen when active:');
  await sleep(200);
  log(agent, 'info', '  1. Launch Playwright (headed Chromium)');
  log(agent, 'info', '  2. Login to gemini.google.com using account .env credentials');
  log(agent, 'info', '  3. Upload pose_ref.jpg → generate pose JSON descriptor');
  await sleep(300);

  const poseJson = {
    pose:         'standing by a cottage window, looking out wistfully',
    camera_angle: 'medium shot, slightly low angle',
    framing:      'subject centered, window light on left',
    background:   'soft bokeh of overgrown garden outside window',
    lighting:     'diffused natural window light, golden hour tones',
    mood:         'dreamy, contemplative, romantic',
  };

  log(agent, 'info', '  4. Generated pose JSON:');
  console.log(`${C.dim}     ${JSON.stringify(poseJson, null, 2).replace(/\n/g, '\n     ')}${C.reset}`);
  await sleep(400);
  log(agent, 'info', '  5. Open new Gemini chat, upload 5 persona reference images');
  log(agent, 'info', '  6. Send composite prompt with pose JSON');
  log(agent, 'info', '  7. Poll for image generation (timeout: 3 min)');
  log(agent, 'info', '  8. Download result → tmp/raw_generated.jpg');
  await sleep(200);
  log(agent, 'info', 'STUB: Returning placeholder raw image path');

  const stubImagePath = path.join(ctx.tmp_dir, 'raw_generated.jpg');
  fs.writeFileSync(stubImagePath, 'DEMO_RAW_IMAGE_PLACEHOLDER');

  return {
    ...ctx,
    raw_image_path: stubImagePath,
    pose_json:      poseJson,
  };
}

async function runAgent3(ctx) {
  const agent = 'agent3-cleanup';
  log(agent, 'info', '─── Canva Watermark Removal ───');
  await sleep(300);
  log(agent, 'info', 'NOT YET ACTIVE — activate by setting CANVA_EMAIL + CANVA_PASSWORD');
  log(agent, 'info', 'STUB: What would happen when active:');
  await sleep(200);
  log(agent, 'info', '  1. Launch Playwright → login to canva.com (Pro account required)');
  log(agent, 'info', '  2. Create new design: 1080×1350px (portrait feed)');
  log(agent, 'info', '  3. Upload raw_generated.jpg → fit to canvas');
  log(agent, 'info', '  4. Open Edit Image → Magic Eraser tool');
  log(agent, 'info', '  5. Calculate watermark region: bottom-right 15%w × 8%h');
  log(agent, 'info', '  6. Playwright mouse paint over watermark region');
  log(agent, 'info', '  7. Apply erase → export PNG at 1080×1350');
  await sleep(400);
  log(agent, 'info', '  8. Upload to Google Drive: /PERSONA_ENGINE/melody/generated/');
  log(agent, 'info', 'STUB: Returning placeholder Drive URL');

  const stubDriveUrl = `https://drive.google.com/file/d/DEMO_${ctx.run_id.slice(0,8)}/view`;

  return {
    ...ctx,
    clean_image_url: stubDriveUrl,
  };
}

async function runAgent4(ctx) {
  const agent = 'agent4-finishing';
  log(agent, 'info', '─── Instagram Posting + Caption Generation ───');
  await sleep(300);
  log(agent, 'info', 'NOT YET ACTIVE — activate by setting INSTAGRAM_USERNAME + INSTAGRAM_PASSWORD');
  await sleep(200);

  // Phase A: Song research
  log(agent, 'info', 'Phase A: Song research (stub)');
  const song = { name: 'Lavender Haze', artist: 'Taylor Swift', source_url: 'https://open.spotify.com' };
  log(agent, 'info', `  Selected: "${song.name}" — ${song.artist} (matched persona aesthetic: dreamy)`);
  await sleep(300);

  // Phase B: Caption generation — build and show the Gemini prompt
  log(agent, 'info', 'Phase B: Caption generation via Playwright → Gemini');
  const p = ctx.persona_profile;
  const pj = ctx.pose_json || {};
  const captionPrompt = buildCaptionPrompt(p, pj, ctx.caption_hint);
  log(agent, 'info', '  Gemini caption prompt that would be sent:');
  console.log(`\n${C.dim}  ╔${'═'.repeat(58)}╗`);
  captionPrompt.split('\n').forEach(line => {
    console.log(`  ║  ${line.padEnd(56)}║`);
  });
  console.log(`  ╚${'═'.repeat(58)}╝${C.reset}\n`);
  await sleep(500);

  // Generate a demo caption matching Melody's voice
  const demoCaption = `the garden remembers everything the rest of the world forgets 🌿\n\n#cottagecore #softaesthetic #dreamy #indiegirl #naturegirl #aesthetic #vibes`;
  log(agent, 'info', `  Demo caption generated:`);
  console.log(`\n  ${C.green}${C.bold}"${demoCaption.replace(/\n/g, '\n   ')}"${C.reset}\n`);
  await sleep(300);

  // Phase C: Instagram posting
  log(agent, 'info', 'Phase C: Instagram posting (stub)');
  log(agent, 'info', '  Would: Launch Playwright → login to instagram.com');
  if (ctx.post_type === 'feed' || ctx.post_type === 'both') {
    log(agent, 'info', '  Feed: Upload clean image → set 4:5 crop → paste caption → Share');
  }
  if (ctx.post_type === 'story' || ctx.post_type === 'both') {
    log(agent, 'info', `  Story: Upload → add song sticker ("${song.name}") → post`);
  }
  await sleep(300);

  const stubFeedUrl  = `https://www.instagram.com/p/DEMO_${ctx.run_id.slice(0,8)}/`;
  const stubStoryId  = `DEMO_STORY_${ctx.run_id.slice(0,8)}`;

  log(agent, 'info', `  Stub feed URL: ${stubFeedUrl}`);
  log(agent, 'info', 'Pipeline finished — run marked COMPLETED ✓');

  return {
    ...ctx,
    caption:       demoCaption,
    selected_song: song,
    ig_feed_url:   stubFeedUrl,
    ig_story_id:   stubStoryId,
  };
}

function buildCaptionPrompt(persona, poseJson, captionHint) {
  const hintLine = captionHint ? `Operator context note: ${captionHint}\n` : '';
  return [
    `You are writing an Instagram caption for ${persona.name}, a ${persona.age}-year-old`,
    `lifestyle creator with a ${persona.aesthetic} aesthetic.`,
    `Voice: ${persona.caption_voice}.`,
    `Traits: ${persona.personality_tags.join(', ')}.`,
    ``,
    `Photo: ${poseJson.background || 'lifestyle setting'}, ${poseJson.lighting || 'natural'} lighting.`,
    `Mood: ${poseJson.mood || 'aesthetic'}.`,
    hintLine,
    `Rules: max 120 chars body, 1-2 emojis, blank line, 5-8 hashtags.`,
    `Output ONLY the caption.`,
  ].join('\n');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  banner('KARENT — PERSONA ENGINE', C.indigo);
  console.log(`${C.bold}  Demo run for: ${C.green}Melody${C.reset}  ${C.dim}(@melody.in.bloom)${C.reset}`);
  console.log(`${C.dim}  Mode: standalone demo (no Postgres/Redis required)${C.reset}`);
  console.log(`${C.dim}  Agents 2-4 are stubs — showing what each would do when activated${C.reset}\n`);

  // Create run
  const runId = uuidv4();
  const run = {
    id:          runId,
    status:      'running',
    post_type:   'feed',
    created_at:  new Date().toISOString(),
    agent_log:   [],
  };
  db.runs.push(run);

  console.log(`  ${C.cyan}Run ID:${C.reset}    ${C.bold}${runId}${C.reset}`);
  console.log(`  ${C.cyan}Post type:${C.reset} feed`);
  console.log(`  ${C.cyan}Started:${C.reset}   ${new Date().toLocaleTimeString()}\n`);

  // Build initial context
  let ctx = {
    run_id:               runId,
    influencer_id:        db.influencer.id,
    slug:                 db.influencer.slug,
    persona_profile:      MELODY_PERSONA,
    post_type:            'feed',
    caption_hint:         'golden hour, rainy window, feeling nostalgic',
    drive_pose_folder_id: 'NOT_SET',
    reference_image_paths: [],
    currentAgent:         1,
  };

  const agents = [
    { num: 1, name: 'agent1-foundation', label: 'Foundation     — Input Collection',   fn: runAgent1 },
    { num: 2, name: 'agent2-layer',      label: 'Layer          — Gemini Image Gen',   fn: runAgent2 },
    { num: 3, name: 'agent3-cleanup',    label: 'Cleanup        — Canva Watermark',    fn: runAgent3 },
    { num: 4, name: 'agent4-finishing',  label: 'Finishing      — Caption + Instagram',fn: runAgent4 },
  ];

  for (const agentDef of agents) {
    section(`Agent ${agentDef.num} — ${agentDef.label}`);
    const start = Date.now();
    try {
      ctx = await agentDef.fn(ctx);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`\n  ${C.green}✓ Agent ${agentDef.num} completed in ${elapsed}s${C.reset}`);
      run.agent_log.push({ agent: agentDef.name, status: 'ok', elapsed_ms: Date.now() - start });
    } catch (err) {
      console.log(`\n  ${C.red}✗ Agent ${agentDef.num} failed: ${err.message}${C.reset}`);
      run.status    = 'failed';
      run.error_code = 'AGENT_ERROR';
      run.agent_log.push({ agent: agentDef.name, status: 'error', error: err.message });
      process.exit(1);
    }
  }

  // ── Final report ─────────────────────────────────────────────────────────────
  run.status       = 'completed';
  run.completed_at = new Date().toISOString();

  banner('✅  PIPELINE COMPLETE', C.green);

  const totalMs = new Date(run.completed_at) - new Date(run.created_at);

  console.log(`${C.bold}  Run Summary${C.reset}`);
  console.log(`  ${'─'.repeat(52)}`);
  console.log(`  Run ID         ${C.dim}${ctx.run_id}${C.reset}`);
  console.log(`  Account        ${C.bold}${C.green}${db.influencer.display_name}${C.reset}  (@${db.influencer.instagram_handle})`);
  console.log(`  Status         ${C.green}${C.bold}COMPLETED${C.reset}`);
  console.log(`  Total time     ${(totalMs / 1000).toFixed(1)}s`);
  console.log(`  Post type      ${ctx.post_type}`);
  console.log();

  console.log(`  ${C.bold}Generated Assets${C.reset}`);
  console.log(`  ${'─'.repeat(52)}`);
  console.log(`  Pose JSON      ${C.dim}${JSON.stringify(ctx.pose_json?.mood || '').slice(0,40)}...${C.reset}`);
  console.log(`  Raw image      ${C.dim}${ctx.raw_image_path || '—'}${C.reset}`);
  console.log(`  Clean image    ${C.cyan}${ctx.clean_image_url || '—'}${C.reset}`);
  console.log(`  Feed post      ${C.cyan}${ctx.ig_feed_url || '—'}${C.reset}`);
  if (ctx.ig_story_id) console.log(`  Story ID       ${C.dim}${ctx.ig_story_id}${C.reset}`);
  console.log();

  console.log(`  ${C.bold}Caption${C.reset}`);
  console.log(`  ${'─'.repeat(52)}`);
  if (ctx.caption) {
    ctx.caption.split('\n').forEach(line => console.log(`  ${C.green}${line}${C.reset}`));
  }
  console.log();

  if (ctx.selected_song) {
    console.log(`  ${C.bold}Song${C.reset}     ${ctx.selected_song.name} — ${ctx.selected_song.artist}`);
  }
  console.log();

  console.log(`  ${C.bold}Tmp directory${C.reset}  ${ctx.tmp_dir}`);
  console.log();

  console.log(`${C.dim}  Next steps to activate real output:${C.reset}`);
  console.log(`${C.dim}  1. Install Docker Desktop → run: docker-compose up -d${C.reset}`);
  console.log(`${C.dim}  2. Set GOOGLE_EMAIL + GOOGLE_PASSWORD in config/accounts/melody/.env → activates Agent 2${C.reset}`);
  console.log(`${C.dim}  3. Set CANVA_EMAIL + CANVA_PASSWORD → activates Agent 3${C.reset}`);
  console.log(`${C.dim}  4. Set INSTAGRAM_USERNAME + INSTAGRAM_PASSWORD → activates Agent 4${C.reset}`);
  console.log(`${C.dim}  5. npm run dev → open http://localhost:3000${C.reset}`);
  console.log();
}

main().catch((err) => {
  console.error(`\n${C.red}Fatal error: ${err.message}${C.reset}`);
  console.error(err.stack);
  process.exit(1);
});
