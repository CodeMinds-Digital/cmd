#!/usr/bin/env node
// QA Tier 5 — edge cases, validation, auth boundaries.
//   - Unique-slug index (caseStudy, journalPost)
//   - Required-field rejections
//   - Email + URL format validation
//   - Field-length overflow
//   - Public read permissions (auditLog must NOT be readable without auth)
//   - /api/contact edge cases

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client as ServerClient, Databases, ID } from 'node-appwrite';
import { Client as WebClient, Databases as WebDatabases } from 'appwrite';

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
const SITE = process.env.LOCAL_SITE_URL || 'http://localhost:3000';

const server = new ServerClient().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const sdb = new Databases(server);

const web = new WebClient().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
const wdb = new WebDatabases(web);

const TAG = `qa-${Date.now().toString(36)}`;
const findings = [];

function record(name, ok, detail) {
  findings.push({ name, ok, detail });
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function shouldFail(name, fn, expected = 'rejection') {
  try {
    await fn();
    record(name, false, `expected ${expected}, got success`);
  } catch (e) {
    record(name, true, e?.message?.slice(0, 90));
  }
}

async function main() {
  console.log(`QA Edge probe — tag=${TAG}\n`);

  // 1. Unique slug — caseStudy
  const slug = `qa-edge-${TAG}`;
  const c1 = await sdb.createDocument(DB, 'caseStudy', ID.unique(), {
    slug, title: 'A', year: 2026, brief: 'b', status: 'draft',
  });
  await shouldFail('caseStudy unique slug enforced', () =>
    sdb.createDocument(DB, 'caseStudy', ID.unique(), {
      slug, title: 'B', year: 2026, brief: 'b', status: 'draft',
    }),
  );
  await sdb.deleteDocument(DB, 'caseStudy', c1.$id);

  // 2. Required field — testimonial without quote
  await shouldFail('testimonial requires quote', () =>
    sdb.createDocument(DB, 'testimonial', ID.unique(), { author: 'x', role: 'y' }),
  );

  // 3. Email format — lead with bad email
  await shouldFail('lead rejects invalid email', () =>
    sdb.createDocument(DB, 'lead', ID.unique(), {
      name: 'x', email: 'not-an-email', message: 'm', source: 'contact-form', status: 'new',
    }),
  );

  // 4. URL format — caseStudy with bad liveUrl
  await shouldFail('caseStudy rejects invalid url', () =>
    sdb.createDocument(DB, 'caseStudy', ID.unique(), {
      slug: `qa-url-${TAG}`, title: 'A', year: 2026, brief: 'b', status: 'draft',
      liveUrl: 'not a url',
    }),
  );

  // 5. Length overflow — capability.title (size 100)
  await shouldFail('capability rejects oversize title', () =>
    sdb.createDocument(DB, 'capability', ID.unique(), {
      title: 'x'.repeat(120), description: 'd', orderIndex: 1,
    }),
  );

  // 6. Integer bounds — caseStudy.year < 2020
  await shouldFail('caseStudy rejects year < 2020', () =>
    sdb.createDocument(DB, 'caseStudy', ID.unique(), {
      slug: `qa-yr-${TAG}`, title: 'x', year: 1999, brief: 'b', status: 'draft',
    }),
  );

  // 7. Public read — caseStudy SHOULD be readable (read("any"))
  try {
    const list = await wdb.listDocuments(DB, 'caseStudy');
    record('public read caseStudy OK', list.total >= 0, `total=${list.total}`);
  } catch (e) {
    record('public read caseStudy OK', false, e?.message?.slice(0, 90));
  }

  // 8. Public read — auditLog must NOT be readable (read("team:editor"))
  try {
    await wdb.listDocuments(DB, 'auditLog');
    record('public read auditLog blocked', false, 'unexpected success');
  } catch (e) {
    const msg = e?.message ?? '';
    record('public read auditLog blocked', /not authorized|missing scope|guests/i.test(msg), msg.slice(0, 90));
  }

  // 9. Public read — lead must NOT be readable (no read("any"))
  try {
    await wdb.listDocuments(DB, 'lead');
    record('public read lead blocked', false, 'unexpected success');
  } catch (e) {
    const msg = e?.message ?? '';
    record('public read lead blocked', /not authorized|missing scope|guests/i.test(msg), msg.slice(0, 90));
  }

  // 10. Public WRITE — caseStudy must NOT be creatable from web SDK without auth
  try {
    await wdb.createDocument(DB, 'caseStudy', ID.unique(), {
      slug: 'pwn', title: 'x', year: 2026, brief: 'b', status: 'draft',
    });
    record('public write caseStudy blocked', false, 'unexpected success — created');
  } catch (e) {
    const msg = e?.message ?? '';
    record('public write caseStudy blocked', /not authorized|missing scope|guests/i.test(msg), msg.slice(0, 90));
  }

  // 11. Public WRITE — lead create("any") allowed (this is the contact form path)
  try {
    const created = await wdb.createDocument(DB, 'lead', ID.unique(), {
      name: 'qa', email: `${TAG}@example.com`, message: 'qa msg',
      source: 'contact-form', status: 'new',
    });
    record('public write lead allowed', !!created.$id, created.$id);
    await sdb.deleteDocument(DB, 'lead', created.$id).catch(() => {});
  } catch (e) {
    record('public write lead allowed', false, e?.message?.slice(0, 90));
  }

  // 12. /api/contact — happy path returns leadId
  const contact = await fetch(`${SITE}/api/contact`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'qa', email: `${TAG}@example.com`, message: 'qa edge msg' }),
  });
  const cj = await contact.json().catch(() => ({}));
  record('/api/contact happy path', contact.status === 200 && !!cj.leadId, cj.leadId ?? `status=${contact.status}`);
  if (cj.leadId) await sdb.deleteDocument(DB, 'lead', cj.leadId).catch(() => {});

  // 13. /api/contact — name overflow (>200 chars) returns 400
  const long = await fetch(`${SITE}/api/contact`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'x'.repeat(250), email: `${TAG}@example.com`, message: 'm' }),
  });
  record('/api/contact rejects name overflow', long.status === 400, `${long.status}`);

  // 14. Admin route auth gate — /admin without cookie redirects
  const admin = await fetch(`${SITE}/admin`, { redirect: 'manual' });
  record('/admin redirects unauth', admin.status === 307 || admin.status === 308, `${admin.status}`);

  const passed = findings.filter((f) => f.ok).length;
  console.log(`\nSummary: ${passed}/${findings.length} passed`);
  if (passed !== findings.length) process.exit(1);
}

main().catch((e) => {
  console.error('Edge probe crashed:', e?.message ?? e);
  process.exit(1);
});
