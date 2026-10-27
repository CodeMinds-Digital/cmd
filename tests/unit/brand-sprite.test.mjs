import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Every key in brandIconKeys must have a <symbol> in the sprite, and vice versa.
const sprite = readFileSync(new URL('../../public/brand/stack-icons.svg', import.meta.url), 'utf8');
const keysSrc = readFileSync(new URL('../../packages/cms/src/brand-icons.ts', import.meta.url), 'utf8');
const symbolIds = [...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]).sort();
const keys = [...keysSrc.matchAll(/^\s+"([a-z0-9]+)",$/gm)].map((m) => m[1]).sort();

test('sprite and brandIconKeys list the same marks', () => {
  assert.ok(keys.length > 0, 'no keys parsed');
  assert.deepEqual(symbolIds, keys);
});

test('every stack item using a brand mark refers to a known key', () => {
  const stack = readFileSync(new URL('../../scripts/appwrite/fixtures/stack.ts', import.meta.url), 'utf8');
  const used = [...stack.matchAll(/icon: '([a-z0-9]+)'/g)].map((m) => m[1]);
  const generic = new Set(['terminal', 'phone', 'code']);
  for (const icon of used) assert.ok(generic.has(icon) || keys.includes(icon), `unknown icon "${icon}"`);
});
