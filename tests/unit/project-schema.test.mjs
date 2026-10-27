import { test } from 'node:test';
import assert from 'node:assert/strict';
import { childId, projectSchema, testimonialIdFor } from '../../packages/cms/src/content/project.ts';

const base = { slug: 'a-b', title: 'T', year: 2026, brief: 'b', tags: [], status: 'live', cover: {}, approach: [], screens: [], metrics: [], testimonial: null };
const ok = (patch) => projectSchema.safeParse({ ...base, ...patch }).success;

test('slug: lowercase words joined by single hyphens', () => {
  assert.ok(ok({ slug: 'fintech-marketing-rebuild' }));
  for (const bad of ['', 'Caps', 'double--hyphen', '-lead', 'trail-', 'spa ce', 'a/b']) assert.equal(ok({ slug: bad }), false, bad);
});

test('images: an upload or a site path, never both; no external URLs', () => {
  assert.ok(ok({ cover: { fileId: 'abc123' } }));
  assert.ok(ok({ cover: { src: '/work/x.svg' } }));
  assert.equal(ok({ cover: { fileId: 'abc', src: '/work/x.svg' } }), false);
  assert.equal(ok({ cover: { src: 'https://evil.example/x.png' } }), false);
  assert.equal(ok({ cover: { src: '//evil.example/x.png' } }), false);
  assert.equal(ok({ cover: { src: '/work/../../etc/passwd' } }), false);
});

test('live link must be https; empty optional text becomes undefined', () => {
  assert.equal(ok({ liveUrl: 'http://x.example' }), false);
  assert.equal(ok({ liveUrl: 'javascript:alert(1)' }), false);
  const r = projectSchema.parse({ ...base, liveUrl: '', client: '   ', liveUrl2: undefined });
  assert.equal(r.liveUrl, undefined);
  assert.equal(r.client, undefined);
});

test('limits match the live columns', () => {
  assert.equal(ok({ metrics: [{ label: 'x'.repeat(61), value: 'v' }] }), false);
  assert.equal(ok({ screens: [{ alt: '' }] }), false);
  assert.equal(ok({ approach: Array.from({ length: 13 }, () => ({ index: '01', title: 't', body: 'b' })) }), false);
});

test('derived child IDs fit Appwrite’s 36-character limit', () => {
  const id = 'x'.repeat(20);
  assert.ok(childId(id, 's', 11).length <= 36);
  assert.ok(testimonialIdFor(id).length <= 36);
});
