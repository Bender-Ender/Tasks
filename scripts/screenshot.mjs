/**
 * Screenshots the running app at phone and desktop widths, light and dark.
 *
 *   npm run dev            # in one shell
 *   npm run shot           # in another
 *
 * Chromium is pre-installed at /opt/pw-browsers/chromium; override with
 * CHROMIUM_PATH if yours lives elsewhere.
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const OUT = process.argv[2] ?? 'screenshots';
const URL_ = process.env.APP_URL ?? 'http://localhost:5173/';

const VIEWS = [
  ['phone-light', 390, 844, 'light'],
  ['phone-dark', 390, 844, 'dark'],
  ['desktop-light', 1440, 900, 'light'],
  ['desktop-dark', 1440, 900, 'dark'],
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });

for (const [name, width, height, colorScheme] of VIEWS) {
  const page = await browser.newPage({ viewport: { width, height }, colorScheme, deviceScaleFactor: 2 });
  await page.goto(URL_, { waitUntil: 'networkidle' });
  await page.waitForSelector('#root *', { timeout: 10_000 });
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await page.close();
  console.log('wrote', `${OUT}/${name}.png`);
}

await browser.close();
