const path = require('path');
const os = require('os');

// ─── Gemini Caption Prompt Template ────────────────────────────────────────────
// Used by Agent 4 (finishing) but defined here since it drives Agent 2's image gen too.
// Replace all [PLACEHOLDER] tokens before sending to Gemini.
const GEMINI_CAPTION_PROMPT_TEMPLATE = `You are writing an Instagram caption for [NAME], a [AGE]-year-old lifestyle content creator with a [AESTHETIC] aesthetic.
Her voice is [CAPTION_VOICE].
Personality traits: [PERSONALITY_TAGS].

The photo shows: [SETTING] with [LIGHTING] lighting. Mood: [MOOD].
[CAPTION_HINT_LINE]
Write one Instagram caption following these rules exactly:
- Body text: maximum 120 characters, [CAPTION_VOICE] tone, 1-2 emojis that fit [AESTHETIC]
- Then a blank line
- Then 5-8 hashtags: mix from [HASHTAG_VIRAL] and [HASHTAG_NICHES]
- Output ONLY the caption. No explanations, no alternatives, no labels.`;

// ─── Gemini Image Generation Prompt Template ───────────────────────────────────
const GEMINI_IMAGE_PROMPT_TEMPLATE = `Generate a photo-realistic image by replacing the person in the following prompt with the woman from the reference images I'm attaching. Preserve her exact facial features, skin tone, and hair. Apply her appearance to this scene: [POSE_JSON]. Ensure the result looks like a natural, candid lifestyle photograph. Do not alter facial identity.`;

/**
 * Agent 2 — Layer (Gemini Image Generation)
 *
 * STUB — not yet active.
 *
 * Full implementation will:
 *   Phase A: Launch Playwright (headed Chromium), login to gemini.google.com using
 *            GOOGLE_EMAIL + GOOGLE_PASSWORD from account .env, upload pose_ref.jpg,
 *            prompt Gemini to generate a pose JSON descriptor, extract + validate JSON.
 *   Phase B: Open new Gemini chat, tick 'Create Image', upload all reference images,
 *            inject pose JSON into GEMINI_IMAGE_PROMPT_TEMPLATE, poll for generation,
 *            download result to tmp/{run_id}/raw_generated.jpg.
 *
 * Activates automatically when GOOGLE_EMAIL and GOOGLE_PASSWORD are set in account .env.
 */
async function agent2(job, { publishLog }) {
  const { run_id, influencer_id, slug } = job.data;
  const log = (level, msg) => publishLog(run_id, 'agent2-layer', level, msg);

  await log('info', 'Agent 2 (Layer) — Gemini image generation — NOT YET ACTIVE');
  await log('info', 'To activate: set GOOGLE_EMAIL and GOOGLE_PASSWORD in config/accounts/' + slug + '/.env');
  await log('info', 'STUB: Passing through with placeholder raw_generated path');

  const stubImagePath = path.join(os.tmpdir(), 'karent', run_id, 'raw_generated.jpg');

  return {
    ...job.data,
    raw_image_path: stubImagePath,
    pose_json: {
      pose: 'standing, relaxed',
      camera_angle: 'eye level',
      framing: 'medium shot',
      background: 'soft bokeh indoor',
      lighting: 'natural window light',
      mood: 'calm, aesthetic',
    },
    currentAgent: 2,
    _stub: true,
  };
}

module.exports = agent2;
module.exports.GEMINI_CAPTION_PROMPT_TEMPLATE = GEMINI_CAPTION_PROMPT_TEMPLATE;
module.exports.GEMINI_IMAGE_PROMPT_TEMPLATE = GEMINI_IMAGE_PROMPT_TEMPLATE;
