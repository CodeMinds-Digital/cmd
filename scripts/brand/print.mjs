// Print scripts/brand/.out/Assets.html to docs/Assets.pdf with Chromium (vector text + logos).
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('file://' + path.join(here, '.out', 'Assets.html'), { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await p.pdf({ path: path.join(here, '..', '..', 'docs', 'Assets.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
await b.close(); console.log('docs/Assets.pdf written');
