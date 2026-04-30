#!/usr/bin/env node
// QA Tier 4 — workflow & integrations.
//   1. Create draft case study
//   2. Walk status: draft -> review -> scheduled (past date) -> published -> archived
//   3. Hit /api/cron/publish-scheduled to verify it flips a past-due scheduled doc
//   4. Verify audit-log rows can be created/listed
//   5. Cleanup
//
// Talks directly to Appwrite for state changes (no UI), then hits the
// local Next dev server for the cron endpoint.

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
const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET;
const SITE = process.env.LOCAL_SITE_URL || 'http://localhost:3000';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const db = new Databases(client);

const TAG = `qa-${Date.now().toString(36)}`;
const findings = [];

function step(name, ok, detail) {
  findings.push({ name, ok, detail });
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log(`QA Workflow probe — tag=${TAG}\n`);

  // 1. Create draft.
  const slug = `qa-wf-${TAG}`;
  const doc = await db.createDocument(DB, 'caseStudy', ID.unique(), {
    slug,
    title: `QA WF ${TAG}`,
    year: 2026,
    brief: 'qa workflow brief',
    tags: ['qa'],
    status: 'draft',
  });
  step('create draft', doc.status === 'draft', `id=${doc.$id}`);

  try {
    // 2a. draft -> review
    const r1 = await db.updateDocument(DB, 'caseStudy', doc.$id, {
      status: 'review',
      reviewedBy: 'qa-bot',
      reviewedAt: new Date().toISOString(),
    });
    step('transition draft→review', r1.status === 'review' && !!r1.reviewedAt);

    // 2b. review -> scheduled (1 minute in the past so cron picks it up)
    const past = new Date(Date.now() - 60_000).toISOString();
    const r2 = await db.updateDocument(DB, 'caseStudy', doc.$id, {
      status: 'scheduled',
      scheduledFor: past,
    });
    step('transition review→scheduled (past)', r2.status === 'scheduled');

    // 3. Cron — auth gate (already covered in Tier 2; recheck quickly).
    const noAuth = await fetch(`${SITE}/api/cron/publish-scheduled`);
    step('cron rejects no auth', noAuth.status === 401, `${noAuth.status}`);

    const ok = await fetch(`${SITE}/api/cron/publish-scheduled`, {
      headers: { Authorization: `Bearer ${ADMIN_API_SECRET}` },
    });
    const okJson = await ok.json().catch(() => ({}));
    step('cron 200 with bearer', ok.status === 200, JSON.stringify(okJson));

    // Verify the row flipped to published.
    const after = await db.getDocument(DB, 'caseStudy', doc.$id);
    step(
      'scheduled→published via cron',
      after.status === 'published' && !!after.publishedAt,
      `status=${after.status} publishedAt=${after.publishedAt ?? 'null'}`,
    );

    // 2c. published -> archived
    const r3 = await db.updateDocument(DB, 'caseStudy', doc.$id, { status: 'archived' });
    step('transition published→archived', r3.status === 'archived');
  } finally {
    await db.deleteDocument(DB, 'caseStudy', doc.$id).catch(() => {});
  }

  // 4. Audit log create + list.
  const audit = await db.createDocument(DB, 'auditLog', ID.unique(), {
    actor: 'qa-bot',
    action: 'publish',
    collectionId: 'caseStudy',
    documentId: doc.$id,
    documentLabel: slug,
    diffSummary: 'qa workflow probe',
  });
  step('audit-log create', !!audit.$id);

  const list = await db.listDocuments(DB, 'auditLog', [
    Query.equal('documentId', doc.$id),
    Query.limit(5),
  ]);
  step('audit-log list-by-doc', list.total >= 1, `total=${list.total}`);

  await db.deleteDocument(DB, 'auditLog', audit.$id).catch(() => {});

  // 5. Revalidate webhook — auth gate only (signing requires raw body parity).
  const rev = await fetch(`${SITE}/api/revalidate`, {
    method: 'POST',
    body: JSON.stringify({ test: true }),
  });
  step('revalidate webhook rejects unsigned', rev.status === 401, `${rev.status}`);

  const passed = findings.filter((f) => f.ok).length;
  console.log(`\nSummary: ${passed}/${findings.length} passed`);
  if (passed !== findings.length) process.exit(1);
}

main().catch((e) => {
  console.error('Workflow probe crashed:', e?.message ?? e);
  process.exit(1);
});
