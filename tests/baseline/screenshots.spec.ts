import { test, type Page } from '@playwright/test';
import { ROUTES, WIDTHS, OUT_DIR } from './routes';

/**
 * Phase 0 "before" screenshots. These are reference images, not assertions:
 * the Voltage redesign changes the look on purpose.
 *
 * Run with: npm run baseline:screens
 */

// Scroll the whole page so whileInView / scroll-triggered content is revealed,
// then return to the top before capturing.
async function revealAll(page: Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);
}

for (const motion of ['motion', 'reduced'] as const) {
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      test(`${route.name} @${width} ${motion}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({
          reducedMotion: motion === 'reduced' ? 'reduce' : 'no-preference',
        });
        await page.goto(route.path, { waitUntil: 'networkidle' });
        await revealAll(page);
        await page.screenshot({
          path: `${OUT_DIR}/screenshots/${route.name}-${width}-${motion}.png`,
          fullPage: true,
        });
      });
    }
  }
}
