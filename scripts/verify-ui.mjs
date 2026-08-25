/**
 * Drives the running app in a real browser and asserts the Phase 1 journeys.
 *
 *   npm run dev        # in one shell
 *   npm run verify:ui  # in another
 *
 * Screenshots land beside the assertions so a failure is inspectable.
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const OUT = process.argv[2] ?? 'screenshots';
const URL_ = 'http://localhost:5173/';
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
const results = [];
const check = (name, ok, extra = '') => {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`);
};

/* ---------------------------------------------------------------- phone */
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.goto(URL_, { waitUntil: 'networkidle' });
  await page.waitForSelector('li');
  await page.screenshot({ path: `${OUT}/p1-phone-list.png` });

  // create
  await page.getByLabel('New task').fill('Pick up dry cleaning');
  await page.getByRole('button', { name: 'Add' }).click();
  await page.waitForTimeout(400);
  check('create task appears in list', await page.getByText('Pick up dry cleaning').isVisible());

  // complete + undo
  await page.getByRole('checkbox', { name: 'Complete Pick up dry cleaning' }).click();
  await page.waitForTimeout(300);
  const goneAfterComplete = (await page.getByText('Pick up dry cleaning').count()) === 1; // only the toast
  check('completed task leaves the open list', goneAfterComplete);
  await page.screenshot({ path: `${OUT}/p1-phone-undo.png` });
  await page.getByRole('button', { name: 'Undo' }).click();
  await page.waitForTimeout(500);
  check('undo brings it back', await page.getByRole('checkbox', { name: 'Complete Pick up dry cleaning' }).isVisible());

  // open detail (full-screen sheet on a phone)
  await page.getByText('Draft Q3 board update').click();
  await page.waitForSelector('text=Sub-tasks');
  check('detail shows sub-task progress', (await page.getByText('2/5').count()) > 0);
  await page.screenshot({ path: `${OUT}/p1-phone-detail.png` });

  // edit the title, and confirm it survives a reload
  const title = page.getByLabel('Title');
  await title.fill('Draft the Q3 board update for Rakesh');
  await title.blur();
  await page.waitForTimeout(700);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('li');
  check('title edit persisted', await page.getByText('Draft the Q3 board update for Rakesh').isVisible());

  // add a sub-task
  await page.getByText('Draft the Q3 board update for Rakesh').click();
  await page.waitForSelector('text=Sub-tasks');
  await page.getByLabel('New sub-task').fill('Check last quarter’s wording');
  await page.getByLabel('New sub-task').press('Enter');
  await page.waitForTimeout(500);
  check('sub-task added', (await page.getByText('2/6').count()) > 0);

  // back button closes the sheet rather than leaving the app
  await page.goBack();
  await page.waitForTimeout(400);
  check('browser back closes the detail sheet', await page.getByLabel('New task').isVisible());

  await page.close();
}

/* -------------------------------------------------------------- desktop */
for (const scheme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, deviceScaleFactor: 2 });
  await page.goto(URL_, { waitUntil: 'networkidle' });
  await page.waitForSelector('li');
  await page.getByText('Fix the leaking kitchen tap').click();
  await page.waitForSelector('text=Sub-tasks');
  await page.screenshot({ path: `${OUT}/p1-desktop-${scheme}.png` });

  if (scheme === 'light') {
    const listVisible = await page.getByLabel('New task').isVisible();
    check('detail sits beside the list on desktop', listVisible);

    // deadline + category are editable from the pane
    await page.getByLabel('Category').selectOption({ label: 'Errands' });
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText('Fix the leaking kitchen tap').click();
    await page.waitForTimeout(300);
    check('category change persisted', (await page.getByText('Errands').count()) > 0);
  }
  await page.close();
}

await browser.close();
console.log(results.join('\n'));
if (results.some((r) => r.startsWith('FAIL'))) process.exitCode = 1;
