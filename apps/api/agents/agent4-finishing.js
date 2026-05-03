const { GEMINI_CAPTION_PROMPT_TEMPLATE } = require('./agent2-layer');

/**
 * Builds the Gemini caption prompt from a persona profile + pose context.
 * @param {object} personaProfile - The influencer's persona_profile JSON
 * @param {object} poseJson - The pose descriptor from Agent 2
 * @param {string|null} captionHint - Operator-provided hint (optional)
 */
function buildCaptionPrompt(personaProfile, poseJson, captionHint) {
  const p = personaProfile;
  const captionHintLine = captionHint
    ? `The operator's context note is: ${captionHint}\n`
    : '';

  return GEMINI_CAPTION_PROMPT_TEMPLATE
    .replace('[NAME]', p.name || 'her')
    .replace('[AGE]', String(p.age || ''))
    .replace(/\[AESTHETIC\]/g, p.aesthetic || '')
    .replace(/\[CAPTION_VOICE\]/g, p.caption_voice || 'casual and aspirational')
    .replace('[PERSONALITY_TAGS]', (p.personality_tags || []).join(', '))
    .replace('[SETTING]', poseJson?.background || 'lifestyle setting')
    .replace('[LIGHTING]', poseJson?.lighting || 'natural')
    .replace('[MOOD]', poseJson?.mood || 'aesthetic')
    .replace('[CAPTION_HINT_LINE]', captionHintLine)
    .replace('[HASHTAG_VIRAL]', (p.hashtag_viral || []).join(', '))
    .replace('[HASHTAG_NICHES]', (p.hashtag_niches || []).join(', '));
}

/**
 * Agent 4 — Finishing (Instagram Posting + Caption Generation)
 *
 * STUB — not yet active.
 *
 * Full implementation will:
 *
 *   Phase A — Song Research:
 *     Use fetch to search "trending lo-fi songs this week site:spotify.com OR site:youtube.com",
 *     parse top 3 results, select best match against persona_profile.personality_tags.
 *
 *   Phase B — Caption Generation (Playwright → Gemini):
 *     Launch Playwright (headed Chromium) using the stored browser context for
 *     the influencer's GOOGLE account. Navigate to gemini.google.com, create a new
 *     chat, send the prompt built by buildCaptionPrompt(), extract the caption text.
 *     This uses Playwright (NOT the Claude API) — no ANTHROPIC_API_KEY required.
 *
 *   Phase C — Instagram Posting (Playwright → instagram.com):
 *     Login with INSTAGRAM_USERNAME + INSTAGRAM_PASSWORD (browser state persisted).
 *     If post_type includes 'feed': Upload clean image, set 4:5 crop, paste caption, Share.
 *     If post_type includes 'story': Upload same image, add song sticker, add short caption overlay, Post.
 *     Log post URLs + IDs to the tenant DB posts table.
 *
 *   Anti-detection measures:
 *     Random human-like delays (800ms–3000ms) between all Playwright actions.
 *     Headed mode (not headless) to avoid bot fingerprinting.
 *
 * Activates automatically when INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD are set in account .env.
 */
async function agent4(job, { publishLog, updateRunStatus }) {
  const { run_id, influencer_id, slug, persona_profile, pose_json, caption_hint } = job.data;
  const log = (level, msg) => publishLog(run_id, 'agent4-finishing', level, msg);

  await log('info', 'Agent 4 (Finishing) — Instagram posting + Gemini caption — NOT YET ACTIVE');
  await log('info', 'To activate: set INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD in config/accounts/' + slug + '/.env');

  // Show the caption prompt that will be used — useful for operator to preview/tune
  if (persona_profile) {
    const preview = buildCaptionPrompt(
      persona_profile,
      pose_json || {},
      caption_hint || null
    );
    await log('info', `Caption prompt preview (first 200 chars): ${preview.slice(0, 200)}...`);
  }

  await log('info', 'STUB: Returning placeholder post URLs');

  return {
    ...job.data,
    ig_feed_url: `https://www.instagram.com/p/STUB_${run_id}/`,
    ig_story_id: `STUB_STORY_${run_id}`,
    caption: '[stub caption — activate agent to generate real caption via Gemini]',
    selected_song: {
      name: 'Stub Song',
      artist: 'Stub Artist',
      source_url: 'https://open.spotify.com',
    },
    currentAgent: 4,
    _stub: true,
  };
}

module.exports = agent4;
module.exports.buildCaptionPrompt = buildCaptionPrompt;
