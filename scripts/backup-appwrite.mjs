#!/usr/bin/env node
// Backup all Appwrite content as JSON snapshots in ./backups/<timestamp>/.
//
// What's saved:
//   - Every document from every collection (paginated)
//   - Storage manifest (file IDs, names, sizes, mime types — no bytes)
//   - Index of teams (no member lists)
//
// Storage file BYTES are deliberately not downloaded — Appwrite Storage
// is the source of truth and downloading the full bucket on every run
// would be wasteful. If you want full bytes, pipe `appwrite storage download`
// for the IDs in storage.json afterwards.
//
// Usage:
//   node scripts/backup-appwrite.mjs              # writes ./backups/2026-04-29-…/
//   node scripts/backup-appwrite.mjs --out=/tmp   # writes to /tmp/2026-04-29-…/

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client, Databases, Storage, Teams, Query } from 'node-appwrite';

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
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DATABASE_ID) {
  console.error('Missing required env vars in .env.local');
  process.exit(1);
}

const outArg = process.argv.find((a) => a.startsWith('--out='));
const outRoot = outArg ? outArg.slice(6) : resolve(process.cwd(), 'backups');
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = resolve(outRoot, stamp);
mkdirSync(outDir, { recursive: true });

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);
const storage = new Storage(client);
const teams = new Teams(client);

const log = {
  step: (s) => console.log(`\n> ${s}`),
  ok: (s) => console.log(`  + ${s}`),
};

async function pageThrough(fetcher, batchSize = 100) {
  const all = [];
  let cursor;
  while (true) {
    const queries = [Query.limit(batchSize)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const page = await fetcher(queries);
    all.push(...page.documents);
    if (page.documents.length < batchSize) break;
    cursor = page.documents[page.documents.length - 1].$id;
  }
  return all;
}

async function backupCollections() {
  log.step('Collections');
  const list = await databases.listCollections(DATABASE_ID);
  const summary = [];
  for (const coll of list.collections) {
    const docs = await pageThrough((q) =>
      databases.listDocuments(DATABASE_ID, coll.$id, q),
    );
    writeFileSync(
      resolve(outDir, `${coll.$id}.json`),
      JSON.stringify(
        { collectionId: coll.$id, name: coll.name, exportedAt: new Date().toISOString(), count: docs.length, documents: docs },
        null,
        2,
      ),
    );
    summary.push({ id: coll.$id, name: coll.name, count: docs.length });
    log.ok(`${coll.$id} — ${docs.length} doc${docs.length === 1 ? '' : 's'}`);
  }
  return summary;
}

async function backupStorageManifest() {
  log.step('Storage manifest');
  const buckets = await storage.listBuckets();
  const manifest = [];
  for (const bucket of buckets.buckets) {
    let cursor;
    const files = [];
    while (true) {
      const queries = [Query.limit(100)];
      if (cursor) queries.push(Query.cursorAfter(cursor));
      const page = await storage.listFiles(bucket.$id, queries);
      files.push(...page.files);
      if (page.files.length < 100) break;
      cursor = page.files[page.files.length - 1].$id;
    }
    manifest.push({
      bucketId: bucket.$id,
      name: bucket.name,
      count: files.length,
      files: files.map((f) => ({
        $id: f.$id,
        name: f.name,
        sizeOriginal: f.sizeOriginal,
        mimeType: f.mimeType,
        $createdAt: f.$createdAt,
      })),
    });
    log.ok(`${bucket.$id} — ${files.length} file${files.length === 1 ? '' : 's'}`);
  }
  writeFileSync(resolve(outDir, 'storage.json'), JSON.stringify(manifest, null, 2));
  return manifest.reduce((n, b) => n + b.count, 0);
}

async function backupTeams() {
  log.step('Teams');
  const list = await teams.list();
  writeFileSync(
    resolve(outDir, 'teams.json'),
    JSON.stringify(
      list.teams.map((t) => ({ $id: t.$id, name: t.name, total: t.total })),
      null,
      2,
    ),
  );
  log.ok(`${list.teams.length} team${list.teams.length === 1 ? '' : 's'}`);
  return list.teams.length;
}

async function main() {
  console.log(`Project:  ${PROJECT_ID}`);
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Output:   ${outDir}`);

  const colls = await backupCollections();
  const fileCount = await backupStorageManifest();
  const teamCount = await backupTeams();

  const totalDocs = colls.reduce((n, c) => n + c.count, 0);
  const summary = {
    project: PROJECT_ID,
    endpoint: ENDPOINT,
    database: DATABASE_ID,
    exportedAt: new Date().toISOString(),
    collectionsExported: colls.length,
    documentsExported: totalDocs,
    filesIndexed: fileCount,
    teamsIndexed: teamCount,
    collections: colls,
  };
  writeFileSync(resolve(outDir, '_summary.json'), JSON.stringify(summary, null, 2));

  console.log(`\nBackup complete — ${outDir}`);
  console.log(`  ${colls.length} collections, ${totalDocs} documents, ${fileCount} files (manifest only)`);
}

main().catch((e) => {
  console.error('\nBackup failed:', e?.message ?? e);
  process.exit(1);
});
