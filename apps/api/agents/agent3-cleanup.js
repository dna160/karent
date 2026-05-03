/**
 * Agent 3 — Cleanup (Canva Watermark Removal)
 *
 * STUB — not yet active.
 *
 * Full implementation will:
 *   1. Launch Playwright (headed Chromium), login to canva.com using
 *      CANVA_EMAIL + CANVA_PASSWORD from account .env (browser state persisted).
 *   2. Create a new design: Custom size 1080×1350px (portrait feed format).
 *   3. Upload raw_generated.jpg, fit to canvas.
 *   4. Open Edit Image → Magic Eraser tool.
 *   5. Calculate watermark bounding box: last 15% width × last 8% height (bottom-right).
 *   6. Use Playwright mouse.move() + mouse.down() + mouse.up() to paint over region.
 *   7. Click 'Erase', wait for completion.
 *   8. Export PNG at 1080×1350, download locally.
 *   9. Upload to Google Drive: /PERSONA_ENGINE/{slug}/generated/{YYYY-MM-DD}/
 *  10. Save Drive file URL to run context.
 *
 * Watermark fallback: if Magic Eraser selector not found after 3 retries,
 * exports the image as-is and flags run status as 'review' (NEEDS_REVIEW).
 *
 * Activates automatically when CANVA_EMAIL and CANVA_PASSWORD are set in account .env.
 */
async function agent3(job, { publishLog, updateRunStatus }) {
  const { run_id, influencer_id, slug } = job.data;
  const log = (level, msg) => publishLog(run_id, 'agent3-cleanup', level, msg);

  await log('info', 'Agent 3 (Cleanup) — Canva watermark removal — NOT YET ACTIVE');
  await log('info', 'To activate: set CANVA_EMAIL and CANVA_PASSWORD in config/accounts/' + slug + '/.env');
  await log('info', 'STUB: Passing through with placeholder clean_image_url');

  const stubDriveUrl = `https://drive.google.com/file/d/STUB_${run_id}/view`;

  return {
    ...job.data,
    clean_image_url: stubDriveUrl,
    currentAgent: 3,
    _stub: true,
  };
}

module.exports = agent3;
