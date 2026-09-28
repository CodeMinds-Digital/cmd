import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * WCAG contrast check over the real Voltage tokens (plan §3.1 / Phase 5).
 * Parses the OKLCH values out of src/styles/globals.css, so editing a token
 * that breaks a text/background pair fails this test.
 */

const css = readFileSync(new URL('../../src/styles/globals.css', import.meta.url), 'utf8');

const OKLCH = /oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+)?\s*\)/g;

/** token name → { light, dark } as [L(0-1), C, H]. */
function readTokens() {
  const tokens = {};
  for (const [, name, value] of css.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) {
    const colors = [...value.matchAll(OKLCH)].map((m) => [Number(m[1]) / 100, Number(m[2]), Number(m[3])]);
    if (!colors.length) continue;
    tokens[name] = { light: colors[0], dark: colors[1] ?? colors[0] };
  }
  return tokens;
}

function oklchToLinearSrgb([L, C, H]) {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (v) => Math.min(1, Math.max(0, v));
  return [
    clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

const luminance = (c) => {
  const [r, g, b] = oklchToLinearSrgb(c);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const tokens = readTokens();

// [text, background] pairs the design actually uses for text.
const TEXT_PAIRS = [
  ['fg', 'canvas'], ['fg', 'surface'], ['fg', 'surface-sunk'],
  ['fg-muted', 'canvas'], ['fg-muted', 'surface'], ['fg-muted', 'surface-sunk'],
  ['fg-subtle', 'canvas'], ['fg-subtle', 'surface'], ['fg-subtle', 'surface-sunk'],
  ['accent-ink', 'canvas'], ['accent-ink', 'surface'],
  ['accent-fg', 'accent'],
  ['inverse-fg', 'inverse'],
  ['danger', 'canvas'], ['danger', 'surface'],
];

test('tokens were parsed', () => {
  for (const name of new Set(TEXT_PAIRS.flat())) assert.ok(tokens[name], `missing token --color-${name}`);
});

for (const scheme of ['light', 'dark']) {
  for (const [fg, bg] of TEXT_PAIRS) {
    test(`${scheme}: ${fg} on ${bg} ≥ 4.5:1`, () => {
      const ratio = contrast(tokens[fg][scheme], tokens[bg][scheme]);
      assert.ok(ratio >= 4.5, `${fg} on ${bg} (${scheme}) is ${ratio.toFixed(2)}:1`);
    });
  }
}

test('accent fill is NOT text-safe on canvas (documents the accent rule)', () => {
  // If this ever passes 4.5:1 the accent/accent-ink split can be revisited.
  assert.ok(contrast(tokens.accent.light, tokens.canvas.light) < 4.5);
});
