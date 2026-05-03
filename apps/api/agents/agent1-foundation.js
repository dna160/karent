const fs = require('fs');
const path = require('path');
const os = require('os');
const { tenantExecute } = require('../db/tenant');

const REQUIRED_FIELDS = ['run_id', 'influencer_id', 'slug', 'post_type', 'persona_profile'];

/**
 * Agent 1 — Foundation
 * Validates inputs, stubs Google Drive pose selection, builds the run context,
 * and updates the run record to 'running' in the tenant schema.
 */
async function agent1(job, { publishLog, updateRunStatus }) {
  const data = job.data;
  const { run_id, influencer_id, slug } = data;

  const log = (level, message) => publishLog(run_id, 'agent1-foundation', level, message);

  await log('info', 'Agent 1 started — validating inputs');

  // ── Step 1: Validate required fields ───────────────────────────────────────
  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) {
      throw Object.assign(new Error(`Missing required field: ${field}`), { code: 'VALIDATION_ERROR' });
    }
  }
  await log('info', 'Input validation passed');

  // ── Step 2: Validate reference image paths exist ────────────────────────────
  const referencePaths = data.reference_image_paths || [];
  if (referencePaths.length === 0) {
    throw Object.assign(new Error('No reference images provided'), { code: 'VALIDATION_ERROR' });
  }

  for (const imgPath of referencePaths) {
    if (!fs.existsSync(imgPath)) {
      throw Object.assign(
        new Error(`Reference image not found: ${imgPath}`),
        { code: 'FILE_NOT_FOUND' }
      );
    }
  }
  await log('info', `Validated ${referencePaths.length} reference image(s)`);

  // ── Step 3: Google Drive pose reference (STUBBED) ──────────────────────────
  const driveFolderId = data.drive_pose_folder_id || 'NOT_SET';
  await log('info', `DRIVE_STUB: Would list files in Drive folder: ${driveFolderId}`);
  await log('info', 'DRIVE_STUB: Using placeholder pose reference path');

  // Stub: create a placeholder pose ref path in tmp
  const tmpDir = path.join(os.tmpdir(), 'karent', run_id);
  fs.mkdirSync(tmpDir, { recursive: true });
  const poseRefPath = path.join(tmpDir, 'pose_ref.jpg');

  // Write a stub marker file so downstream agents can check existence
  if (!fs.existsSync(poseRefPath)) {
    fs.writeFileSync(poseRefPath, 'STUB_POSE_REF');
    await log('info', `DRIVE_STUB: Wrote placeholder at ${poseRefPath}`);
  }

  // ── Step 4: Update run status to 'running' ─────────────────────────────────
  await updateRunStatus(influencer_id, run_id, 'running');
  await log('info', 'Run status updated to: running');

  // ── Step 5: Build run context ──────────────────────────────────────────────
  const runContext = {
    ...data,
    pose_ref_path: poseRefPath,
    tmp_dir: tmpDir,
    run_context_built_at: new Date().toISOString(),
    currentAgent: 1,
  };

  await log('info', 'Run context built — handing off to Agent 2');

  return runContext;
}

module.exports = agent1;
