import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { signPreview, verifyPreview, verifyRevalidate, isSafePath } from '../../packages/cms/src/signing.ts';
import { tableFromEvent, tagForTable } from '../../packages/cms/src/cache-tags.ts';
import { caseFromProject, toCapability, toCase, toPost, toSiteSettings, toStackItem } from '../../src/lib/cms/mappers.ts';

const SECRET = 'k'.repeat(64);
const now = 1_800_000_000;

test('revalidate signature: valid, tampered, stale, missing', () => {
  const body = JSON.stringify({ events: ['databases.db.tables.caseStudy.rows.r1.update'] });
  const sig = createHmac('sha256', SECRET).update(`${now}.${body}`).digest('hex');
  assert.equal(verifyRevalidate(SECRET, body, String(now), sig, now), true);
  assert.equal(verifyRevalidate(SECRET, body + ' ', String(now), sig, now), false);
  assert.equal(verifyRevalidate(SECRET, body, String(now), sig, now + 301), false);
  assert.equal(verifyRevalidate(SECRET, body, String(now), null, now), false);
  assert.equal(verifyRevalidate(SECRET, body, 'abc', sig, now), false);
});

test('preview links: round trip, expiry, path safety', () => {
  const p = signPreview(SECRET, '/work/x', now);
  assert.equal(verifyPreview(SECRET, p.path, String(p.expires), p.signature, now), true);
  assert.equal(verifyPreview(SECRET, '/work/y', String(p.expires), p.signature, now), false);
  assert.equal(verifyPreview(SECRET, p.path, String(p.expires), p.signature, p.expires + 1), false);
  assert.throws(() => signPreview(SECRET, '//evil.example'));
  for (const bad of ['https://evil.example', '//evil.example', '/\\evil', '/a\r\nb']) assert.equal(isSafePath(bad), false);
});

test('events map to cache tags; private tables never do', () => {
  assert.equal(tableFromEvent('databases.cmd.tables.caseScreen.rows.abc.delete'), 'caseScreen');
  assert.equal(tagForTable('caseScreen'), 'cms:cases');
  assert.equal(tagForTable('siteSettings'), 'cms:site');
  assert.equal(tagForTable('lead'), undefined);
  assert.equal(tagForTable('auditLog'), undefined);
  assert.equal(tagForTable('constructor'), undefined);
  assert.equal(tableFromEvent('users.abc.create'), undefined);
});

const row = (o) => ({ $id: 'x', $createdAt: '', $updatedAt: '', $permissions: [], $tableId: 't', $databaseId: 'd', $sequence: 1, ...o });

test('case rows assemble children in order, nulls become undefined', () => {
  const c = row({ $id: 'c1', slug: 's', title: 'T', client: null, year: 2026, brief: 'b', tags: ['a'], status: 'live', eta: null, coverSrc: '/c.svg', coverAlt: null, role: null, duration: null, liveUrl: null, problem: 'p', testimonialId: 't1' });
  const kids = {
    steps: [row({ caseStudyId: 'c1', orderIndex: 1, displayIndex: '02', title: 'B', body: 'b' }), row({ caseStudyId: 'c1', orderIndex: 0, displayIndex: '01', title: 'A', body: 'a' }), row({ caseStudyId: 'other', orderIndex: 0, displayIndex: '09', title: 'Z', body: 'z' })],
    screens: [],
    metrics: [row({ caseStudyId: 'c1', orderIndex: 0, label: 'LCP', value: '1.6s' })],
    testimonials: [row({ $id: 't1', quote: 'q', author: 'a', role: 'r', approved: true })],
  };
  const url = (id) => `https://files.example/${id}`;
  const out = toCase(c, kids, url);
  assert.deepEqual(out.approach.map((s) => s.index), ['01', '02']);
  assert.equal(out.screens, undefined);
  assert.equal(out.client, undefined);
  assert.equal(out.cover, '/c.svg');
  assert.deepEqual(out.testimonial, { quote: 'q', author: 'a', role: 'r' });
  // Unapproved testimonials are not shown.
  kids.testimonials[0].approved = false;
  assert.equal(toCase(c, kids, url).testimonial, undefined);
  // Uploaded images resolve to storage URLs; a site path wins when both exist.
  assert.equal(toCase({ ...c, coverSrc: null, coverFileId: 'f1' }, kids, url).cover, 'https://files.example/f1');
});

test('post date is the calendar date of publishedAt', () => {
  assert.equal(toPost(row({ slug: 's', title: 't', excerpt: 'e', publishedAt: '2026-04-12T00:00:00.000+00:00', readingTime: null, tags: null, body: null }), (id) => id).date, '2026-04-12');
});

test('capability spans only accept the bento sizes', () => {
  const cap = (spanMd, spanLg) => toCapability(row({ displayIndex: '01', title: 't', description: 'd', tags: [], services: [], proof: null, tone: null, spanMd, spanLg }), []);
  assert.equal(cap(null, null).span, undefined);
  assert.deepEqual(cap(6, 8).span, { md: 6, lg: 8 });
  assert.deepEqual(cap(7, 6).span, { lg: 6 });
});

test('unknown stack icons fall back to the generic glyph', () => {
  const keys = new Set(['rust']);
  assert.equal(toStackItem(row({ label: 'Rust', category: 'languages', icon: 'rust' }), keys).icon, 'rust');
  assert.equal(toStackItem(row({ label: 'iOS', category: 'mobile', icon: 'phone' }), keys).icon, 'phone');
  assert.equal(toStackItem(row({ label: 'X', category: 'web', icon: 'nope' }), keys).icon, 'code');
});

test('site settings keep the shape components expect', () => {
  const s = toSiteSettings(row({ contactEmail: 'a@b.c', bookingUrl: 'https://cal.com/x', city: 'Chennai', country: 'India', timezoneLabel: 'IST', replyWithin: '24 hours', bookingOpen: true, bookingDetail: null, deliveryMinWeeks: 2, deliveryMaxWeeks: 4, disciplines: ['Web'] }));
  assert.deepEqual(s.delivery, { minWeeks: 2, maxWeeks: 4 });
  assert.deepEqual(s.booking, { open: true, detail: null });
});

test('a draft maps to the same shape as a live case', () => {
  const d = { slug: 'x', title: 'X', year: 2026, brief: 'b', tags: [], status: 'coming', cover: { fileId: 'f9', alt: 'c' }, approach: [], screens: [{ alt: 's', fileId: 'f2' }], metrics: [], testimonial: null };
  const c = caseFromProject(d, (id) => `u:${id}`);
  assert.equal(c.cover, 'u:f9');
  assert.equal(c.approach, undefined);
  assert.equal(c.screens[0].src, 'u:f2');
  assert.equal(c.testimonial, undefined);
});
