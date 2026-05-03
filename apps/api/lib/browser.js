const { chromium } = require('playwright');

/**
 * Launch a Chromium browser with the right headless/headed mode.
 *
 * Local dev:  set PLAYWRIGHT_HEADLESS=false in .env  → headed (you see the browser)
 * Railway:    PLAYWRIGHT_HEADLESS is unset / "true"   → headless (no display on server)
 *
 * @param {object}  [opts]                    Extra options merged into launch()
 * @param {string}  [browserStatePath]        Path to storageState JSON for persisted login
 * @returns {{ browser, context, page }}
 */
async function launchBrowser(opts = {}, browserStatePath = null) {
  const headless = process.env.PLAYWRIGHT_HEADLESS !== 'false';

  const launchOpts = {
    headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
    ...opts,
  };

  const browser = await chromium.launch(launchOpts);

  const contextOpts = {
    viewport: { width: 1280, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'America/New_York',
  };

  if (browserStatePath) {
    const fs = require('fs');
    if (fs.existsSync(browserStatePath)) {
      contextOpts.storageState = browserStatePath;
    }
  }

  const context = await browser.newContext(contextOpts);

  // Human-like: randomise mouse movement slightly
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();

  return { browser, context, page };
}

/**
 * Save browser storage state (cookies + localStorage) for session persistence.
 */
async function saveBrowserState(context, browserStatePath) {
  const fs = require('fs');
  const path = require('path');
  fs.mkdirSync(path.dirname(browserStatePath), { recursive: true });
  await context.storageState({ path: browserStatePath });
}

/**
 * Human-like random delay between minMs and maxMs milliseconds.
 */
function humanDelay(minMs = 800, maxMs = 2500) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { launchBrowser, saveBrowserState, humanDelay };
