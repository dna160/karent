const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ACCOUNTS_DIR = path.join(process.cwd(), 'config', 'accounts');

function loadAccounts() {
  if (!fs.existsSync(ACCOUNTS_DIR)) {
    console.warn('[config-loader] accounts directory not found:', ACCOUNTS_DIR);
    return [];
  }

  const entries = fs.readdirSync(ACCOUNTS_DIR, { withFileTypes: true });
  const accounts = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const slug = entry.name;
    const envPath = path.join(ACCOUNTS_DIR, slug, '.env');

    if (!fs.existsSync(envPath)) {
      console.warn(`[config-loader] No .env for account "${slug}" — skipping`);
      continue;
    }

    const parsed = dotenv.parse(fs.readFileSync(envPath));

    if (parsed.INFLUENCER_SLUG && parsed.INFLUENCER_SLUG !== slug) {
      console.warn(
        `[config-loader] INFLUENCER_SLUG mismatch in "${slug}/.env" — using directory name`
      );
    }

    accounts.push({
      slug,
      google_email: parsed.GOOGLE_EMAIL || null,
      google_password: parsed.GOOGLE_PASSWORD || null,
      canva_email: parsed.CANVA_EMAIL || null,
      canva_password: parsed.CANVA_PASSWORD || null,
      instagram_username: parsed.INSTAGRAM_USERNAME || null,
      instagram_password: parsed.INSTAGRAM_PASSWORD || null,
      drive_folder_id: parsed.GOOGLE_DRIVE_FOLDER_ID || null,
      drive_pose_folder_id: parsed.GOOGLE_DRIVE_POSE_FOLDER_ID || null,
      browser_state_path:
        parsed.BROWSER_STATE_PATH ||
        path.join(ACCOUNTS_DIR, slug, 'browser-state.json'),
      envPath,
    });
  }

  return accounts;
}

function getAccountConfig(slug) {
  const all = loadAccounts();
  return all.find((a) => a.slug === slug) || null;
}

module.exports = { loadAccounts, getAccountConfig, ACCOUNTS_DIR };
