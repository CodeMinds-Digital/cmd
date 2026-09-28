// Pixel-diff two screenshot directories (same filenames). Usage:
//   node tests/baseline/compare.mjs <baselineDir> <candidateDir> [diffDir]
// Prints % of differing pixels per image; writes diff PNGs when diffDir is given.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const [baseDir, candDir, diffDir] = process.argv.slice(2);
if (!baseDir || !candDir) {
  console.error('usage: compare.mjs <baselineDir> <candidateDir> [diffDir]');
  process.exit(2);
}
if (diffDir) mkdirSync(diffDir, { recursive: true });

const rows = [];
for (const file of readdirSync(baseDir).filter((f) => f.endsWith('.png')).sort()) {
  if (!existsSync(`${candDir}/${file}`)) { rows.push([file, 'MISSING']); continue; }
  const a = PNG.sync.read(readFileSync(`${baseDir}/${file}`));
  const b = PNG.sync.read(readFileSync(`${candDir}/${file}`));
  // Compare over the shared area; report a height change separately.
  const width = Math.min(a.width, b.width);
  const height = Math.min(a.height, b.height);
  const crop = (img) => {
    const out = new PNG({ width, height });
    PNG.bitblt(img, out, 0, 0, width, height, 0, 0);
    return out;
  };
  const ca = crop(a), cb = crop(b), diff = new PNG({ width, height });
  const n = pixelmatch(ca.data, cb.data, diff.data, width, height, { threshold: 0.1 });
  if (diffDir && n > 0) writeFileSync(`${diffDir}/${file}`, PNG.sync.write(diff));
  const pct = (100 * n) / (width * height);
  const dh = b.height - a.height;
  rows.push([file, `${pct.toFixed(3)}%`, dh ? `height ${dh > 0 ? '+' : ''}${dh}px` : '']);
}
for (const r of rows) console.log(r.join('  '));
