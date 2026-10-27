import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvCell } from '../../admin/src/lib/csv.ts';
import { cutoff } from '../../appwrite/functions/retention-enquiries/src/main.js';
import { sectionSchemas, STACK_ICONS } from '../../packages/cms/src/content/sections.ts';
import { capabilitiesFromDoc, logosFromDoc, settingsFromDoc } from '../../src/lib/cms/mappers.ts';

test('CSV cells: quoted, quotes doubled, formula starters neutralised', () => {
  assert.equal(csvCell('plain'), '"plain"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  for (const bad of ['=1+1', '+cmd|calc', '-2+3', '@SUM(A1)', '\t=x', '\r=x']) assert.ok(csvCell(bad).startsWith(`"'`), bad);
  assert.equal(csvCell('a-b'), '"a-b"');
});

test('retention cutoff: 24 calendar months back, or N days in a dry run', () => {
  const now = Date.UTC(2026, 9, 27, 12);
  assert.equal(cutoff(now, { months: 24 }), '2024-10-27T12:00:00.000Z');
  assert.equal(cutoff(now, { months: 24, days: 1 }), '2026-10-26T12:00:00.000Z');
  assert.equal(cutoff(Date.UTC(2026, 2, 31), { months: 1 }).slice(0, 10) <= '2026-03-03', true);
});

const settings = { email: 'a@b.example', calUrl: 'https://cal.example', city: 'C', country: 'I', timezoneLabel: 'IST', replyWithin: '24 hours', bookingOpen: true, deliveryMinWeeks: 2, deliveryMaxWeeks: 4, disciplines: ['Web'] };

test('section rules', () => {
  assert.ok(sectionSchemas.settings.safeParse(settings).success);
  assert.equal(sectionSchemas.settings.safeParse({ ...settings, deliveryMinWeeks: 5 }).success, false);
  assert.equal(sectionSchemas.settings.safeParse({ ...settings, calUrl: 'javascript:alert(1)' }).success, false);
  assert.equal(sectionSchemas.stack.safeParse({ items: [{ label: 'X', category: 'web', icon: 'not-an-icon' }] }).success, false);
  assert.ok(STACK_ICONS.includes('code') && STACK_ICONS.includes('rust'));
  assert.equal(sectionSchemas.capabilities.safeParse({ items: [{ title: 't', description: 'd', tags: [], services: [], groups: [], spanLg: 5 }] }).success, false);
});

test('section drafts map to the live shapes', () => {
  const caps = capabilitiesFromDoc({ items: [{ title: 'A', description: 'd', tags: [], services: [], groups: [{ title: 'G', items: ['x'] }], spanLg: 8 }] });
  assert.deepEqual(caps[0], { index: '01', title: 'A', tags: [], description: 'd', services: undefined, proof: undefined, serviceGroups: [{ title: 'G', items: ['x'] }], tone: undefined, span: { lg: 8 } });
  assert.deepEqual(logosFromDoc({ items: [{ name: 'Yes', approved: true, fileId: 'f' }, { name: 'No', approved: false }] }, (id) => `u:${id}`), [{ name: 'Yes', src: 'u:f', width: undefined }]);
  assert.deepEqual(settingsFromDoc(settings).delivery, { minWeeks: 2, maxWeeks: 4 });
});
