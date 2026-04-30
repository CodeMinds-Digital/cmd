/**
 * Migrate static content from src/data/{cases,posts}.ts into Appwrite.
 *
 * Idempotent — re-runs are safe. Existing docs are updated in place
 * (matched by slug); existing files are matched by name and reused.
 *
 * Run with:
 *   npx tsx scripts/migrate-content.ts
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import {
  Client,
  Databases,
  Storage,
  ID,
  Permission,
  Role,
  Query,
} from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { cases } from './seed/cases';
import { posts } from './seed/posts';

// ── env loader (no dotenv dep) ───────────────────────────────────────
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

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const BUCKET = 'public-assets';

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const log = {
  step: (s: string) => console.log(`\n> ${s}`),
  ok: (s: string) => console.log(`  + ${s}`),
  skip: (s: string) => console.log(`  - ${s}`),
  warn: (s: string) => console.log(`  ! ${s}`),
};

const docPerms = [
  Permission.read(Role.any()),
  Permission.update(Role.team('editor')),
  Permission.delete(Role.team('admin')),
];

const filePerms = [
  Permission.read(Role.any()),
  Permission.update(Role.team('editor')),
  Permission.delete(Role.team('admin')),
];

// ── asset uploads — keyed by source path so we don't re-upload ───────
const assetCache = new Map<string, string>(); // sourcePath → fileId

async function uploadOnce(
  sourcePath: string,
): Promise<string | null> {
  // Source paths look like "/work/fintech-cover.svg" — resolve under public/.
  if (!sourcePath || !sourcePath.startsWith('/')) return null;
  if (assetCache.has(sourcePath)) return assetCache.get(sourcePath)!;

  const fsPath = resolve(process.cwd(), 'public' + sourcePath);
  if (!existsSync(fsPath)) {
    log.warn(`asset missing on disk: ${sourcePath}`);
    return null;
  }

  // Check if a file with this basename already exists in the bucket.
  const filename = basename(sourcePath);
  try {
    const listed = await storage.listFiles(BUCKET, [
      Query.equal('name', filename),
      Query.limit(1),
    ]);
    if (listed.total > 0) {
      const fileId = listed.files[0].$id;
      log.skip(`asset ${filename} (already in bucket as ${fileId})`);
      assetCache.set(sourcePath, fileId);
      return fileId;
    }
  } catch {
    // listFiles can 400 on filename queries with special chars; fall through.
  }

  const bytes = readFileSync(fsPath);
  const result = await storage.createFile(
    BUCKET,
    ID.unique(),
    InputFile.fromBuffer(bytes, filename),
    filePerms,
  );
  log.ok(`uploaded ${filename} → ${result.$id}`);
  assetCache.set(sourcePath, result.$id);
  return result.$id;
}

// ── upsert helpers (match by slug) ───────────────────────────────────
async function upsertBySlug(
  collectionId: string,
  slug: string,
  data: Record<string, unknown>,
): Promise<{ $id: string; created: boolean }> {
  const existing = await databases.listDocuments(DATABASE_ID, collectionId, [
    Query.equal('slug', slug),
    Query.limit(1),
  ]);
  if (existing.total > 0) {
    const id = existing.documents[0].$id;
    await databases.updateDocument(DATABASE_ID, collectionId, id, data);
    return { $id: id, created: false };
  }
  const created = await databases.createDocument(
    DATABASE_ID,
    collectionId,
    ID.unique(),
    { ...data, slug },
    docPerms,
  );
  return { $id: created.$id, created: true };
}

// ── testimonials — keyed by author+role since they have no slug ──────
async function upsertTestimonial(
  testimonial: { quote: string; author: string; role: string } | undefined,
): Promise<string | null> {
  if (!testimonial) return null;
  const existing = await databases.listDocuments(DATABASE_ID, 'testimonial', [
    Query.equal('author', testimonial.author),
    Query.equal('role', testimonial.role),
    Query.limit(1),
  ]);
  if (existing.total > 0) {
    const id = existing.documents[0].$id;
    await databases.updateDocument(DATABASE_ID, 'testimonial', id, testimonial);
    log.skip(`testimonial ${testimonial.author} (updated ${id})`);
    return id;
  }
  const result = await databases.createDocument(
    DATABASE_ID,
    'testimonial',
    ID.unique(),
    testimonial,
    docPerms,
  );
  log.ok(`testimonial ${testimonial.author} → ${result.$id}`);
  return result.$id;
}

// ── case-study migration ────────────────────────────────────────────
async function migrateCases() {
  log.step(`Cases (${cases.length})`);

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    log.step(`  case ${i + 1}/${cases.length}: ${c.slug}`);

    const coverFileId = c.cover ? await uploadOnce(c.cover) : null;
    const screenUploads = await Promise.all(
      (c.screens ?? []).map(async (s) => ({
        fileId: s.src ? await uploadOnce(s.src) : null,
        alt: s.alt,
        caption: s.caption ?? '',
        tone: s.tone ?? 'indigo',
      })),
    );
    const testimonialId = await upsertTestimonial(c.testimonial);

    // Build payload — omit optional fields with empty values so format
    // validators (url, etc.) don't reject "" as malformed.
    const data: Record<string, unknown> = {
      title: c.title,
      year: c.year,
      brief: c.brief,
      tags: c.tags,
      status: c.status,
      approachJson: JSON.stringify(c.approach ?? []),
      screensJson: JSON.stringify(screenUploads),
      metricsJson: JSON.stringify(c.metrics ?? []),
      orderIndex: i,
    };
    if (c.client) data.client = c.client;
    if (c.eta) data.eta = c.eta;
    if (coverFileId) data.coverFileId = coverFileId;
    if (c.coverAlt) data.coverAlt = c.coverAlt;
    if (c.role) data.role = c.role;
    if (c.duration) data.duration = c.duration;
    if (c.liveUrl) data.liveUrl = c.liveUrl;
    if (c.problem) data.problem = c.problem;
    if (testimonialId) data.testimonialId = testimonialId;

    const r = await upsertBySlug('caseStudy', c.slug, data);
    log[r.created ? 'ok' : 'skip'](
      `caseStudy ${c.slug} ${r.created ? '→ ' + r.$id : '(updated ' + r.$id + ')'}`,
    );
  }
}

// ── journal-post migration ──────────────────────────────────────────
async function migratePosts() {
  log.step(`Posts (${posts.length})`);

  for (const p of posts) {
    log.step(`  post: ${p.slug}`);
    const data: Record<string, unknown> = {
      title: p.title,
      excerpt: p.excerpt,
      publishedAt: new Date(p.date).toISOString(),
      readingTime: p.readingTime,
      tags: p.tags,
      status: 'published',
    };
    if (p.body) data.body = p.body;
    const r = await upsertBySlug('journalPost', p.slug, data);
    log[r.created ? 'ok' : 'skip'](
      `journalPost ${p.slug} ${r.created ? '→ ' + r.$id : '(updated ' + r.$id + ')'}`,
    );
  }
}

// ── orchestrate ─────────────────────────────────────────────────────
async function main() {
  console.log(`Project:  ${PROJECT_ID}`);
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Database: ${DATABASE_ID}`);
  console.log(`Bucket:   ${BUCKET}`);

  await migrateCases();
  await migratePosts();

  console.log('\nMigration complete');
}

main().catch((e) => {
  console.error('\nMigration failed:', e?.message ?? e);
  process.exit(1);
});
