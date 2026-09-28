import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { ROUTES, OUT_DIR } from './routes';

/**
 * Phase 0 accessibility baseline. Records axe violations per route instead of
 * failing, so later phases can compare against it.
 *
 * Run with: npm run baseline:a11y
 */
test.describe.configure({ mode: 'serial' });

const results: Record<string, unknown> = {};

for (const route of ROUTES) {
  for (const width of [375, 1280]) {
    test(`axe ${route.name} @${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route.path, { waitUntil: 'networkidle' });
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      results[`${route.name}@${width}`] = violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.length,
        targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
      }));
    });
  }
}

test.afterAll(() => {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(`${OUT_DIR}/axe.json`, JSON.stringify(results, null, 2) + '\n');
});
