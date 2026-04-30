#!/usr/bin/env node
// QA Tier 3 — exercise create/read/update/delete on every collection.
// Uses unique slugs / labels prefixed with `qa-` so test rows are easy to
// spot if a run aborts mid-flight. Each probe cleans up its own row.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client, Databases, ID, Query } from 'node-appwrite';

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const [k, ...rest] = t.split('=');
    if (!process.env[k.trim()]) process.env[k.trim()] = rest.join('=').trim();
  }
}
loadEnv();

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DB = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const TAG = `qa-${Date.now().toString(36)}`;
const results = [];

async function probe(name, payloadCreate, payloadUpdate, opts = {}) {
  const t0 = Date.now();
  let createdId = null;
  try {
    const created = await databases.createDocument(DB, name, ID.unique(), payloadCreate);
    createdId = created.$id;

    const read = await databases.getDocument(DB, name, createdId);
    if (!read?.$id) throw new Error('read returned empty');

    const updated = await databases.updateDocument(DB, name, createdId, payloadUpdate);
    for (const [k, v] of Object.entries(payloadUpdate)) {
      const got = updated[k];
      const same = Array.isArray(v) ? JSON.stringify(got) === JSON.stringify(v) : got === v;
      if (!same) throw new Error(`update field "${k}" did not persist (got ${JSON.stringify(got)})`);
    }

    if (opts.list) {
      const list = await databases.listDocuments(DB, name, [Query.equal('$id', createdId), Query.limit(1)]);
      if (list.total < 1) throw new Error('list query did not return doc');
    }

    await databases.deleteDocument(DB, name, createdId);
    createdId = null;

    let gone = false;
    try {
      await databases.getDocument(DB, name, created.$id);
    } catch {
      gone = true;
    }
    if (!gone) throw new Error('delete did not remove doc');

    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`  ok    ${name.padEnd(16)} ${Date.now() - t0}ms`);
  } catch (e) {
    results.push({ name, ok: false, error: e?.message ?? String(e) });
    console.log(`  FAIL  ${name.padEnd(16)} ${e?.message ?? e}`);
    if (createdId) {
      try { await databases.deleteDocument(DB, name, createdId); } catch {}
    }
  }
}

async function main() {
  console.log(`QA CRUD probe — tag=${TAG}`);
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Database: ${DB}\n`);

  await probe(
    'siteSettings',
    { contactEmail: `${TAG}@example.com`, ogTitle: `qa ${TAG}` },
    { ogTitle: `qa ${TAG} updated`, themeColor: '#123456' },
  );

  await probe(
    'navItem',
    { label: `qa ${TAG}`, href: '/qa', location: 'header', orderIndex: 999 },
    { label: `qa ${TAG} updated`, orderIndex: 998 },
    { list: true },
  );

  await probe(
    'testimonial',
    { quote: `qa quote ${TAG}`, author: 'QA Bot', role: 'Probe' },
    { quote: `qa quote ${TAG} updated`, company: 'QA Co' },
  );

  await probe(
    'teamMember',
    { name: `QA ${TAG}`, role: 'Probe', bio: 'qa bio' },
    { bio: 'qa bio updated' },
  );

  await probe(
    'caseStudy',
    {
      slug: `qa-case-${TAG}`,
      title: `QA Case ${TAG}`,
      year: 2026,
      brief: 'qa brief',
      tags: ['qa', 'probe'],
      status: 'draft',
    },
    { title: `QA Case ${TAG} updated`, status: 'review', tags: ['qa', 'updated'] },
    { list: true },
  );

  await probe(
    'capability',
    { title: `qa-cap-${TAG}`, description: 'qa cap', orderIndex: 99 },
    { description: 'qa cap updated', tags: ['x', 'y'] },
  );

  await probe(
    'processStep',
    { displayIndex: '99', title: `qa step ${TAG}`, body: 'qa body', orderIndex: 99 },
    { body: 'qa body updated', deliverables: ['a', 'b'] },
  );

  await probe(
    'clientLogo',
    { name: `qa-logo-${TAG}`, orderIndex: 999 },
    { name: `qa-logo-${TAG}-updated`, ndaBound: true },
  );

  await probe(
    'journalPost',
    {
      slug: `qa-post-${TAG}`,
      title: `QA Post ${TAG}`,
      excerpt: 'qa excerpt',
      publishedAt: new Date().toISOString(),
      body: 'qa body',
      status: 'draft',
    },
    { title: `QA Post ${TAG} updated`, status: 'published' },
    { list: true },
  );

  await probe(
    'auditLog',
    {
      actor: 'qa@bot',
      action: 'create',
      collectionId: 'qa',
      documentId: 'qa-doc',
      documentLabel: `qa ${TAG}`,
    },
    { diffSummary: 'qa diff updated' },
  );

  await probe(
    'lead',
    {
      name: 'QA Bot',
      email: `${TAG}@example.com`,
      message: 'qa message',
      source: 'contact-form',
      status: 'new',
    },
    { status: 'qualified', notes: 'qa note' },
    { list: true },
  );

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log(`\nSummary: ${passed}/${results.length} passed${failed ? `, ${failed} failed` : ''}`);
  if (failed) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Probe crashed:', e?.message ?? e);
  process.exit(1);
});
