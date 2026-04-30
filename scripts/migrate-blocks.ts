/**
 * Migrate the Phase A4 reusable content blocks (capabilities, process steps,
 * client logos) and hero copy fields into Appwrite. Idempotent.
 *
 *   npx tsx scripts/migrate-blocks.ts
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  Client,
  Databases,
  ID,
  Permission,
  Role,
  Query,
} from 'node-appwrite';
import {
  capabilities,
  processSteps,
  clientLogos,
  heroCopy,
} from './seed/blocks';

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

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);
const databases = new Databases(client);

const log = {
  step: (s: string) => console.log(`\n> ${s}`),
  ok: (s: string) => console.log(`  + ${s}`),
  skip: (s: string) => console.log(`  - ${s}`),
};

const docPerms = [
  Permission.read(Role.any()),
  Permission.update(Role.team('editor')),
  Permission.delete(Role.team('admin')),
];

/** Upsert a document keyed by a single attribute. */
async function upsertBy(
  collectionId: string,
  matchAttribute: string,
  matchValue: string,
  data: Record<string, unknown>,
): Promise<{ $id: string; created: boolean }> {
  const existing = await databases.listDocuments(DATABASE_ID, collectionId, [
    Query.equal(matchAttribute, matchValue),
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
    data,
    docPerms,
  );
  return { $id: created.$id, created: true };
}

async function migrateCapabilities() {
  log.step(`Capabilities (${capabilities.length})`);
  for (const c of capabilities) {
    const r = await upsertBy('capability', 'displayIndex', c.displayIndex, c);
    log[r.created ? 'ok' : 'skip'](
      `${c.displayIndex} ${c.title} ${r.created ? '→ ' + r.$id : '(updated ' + r.$id + ')'}`,
    );
  }
}

async function migrateProcessSteps() {
  log.step(`Process steps (${processSteps.length})`);
  for (const s of processSteps) {
    const r = await upsertBy('processStep', 'displayIndex', s.displayIndex, s);
    log[r.created ? 'ok' : 'skip'](
      `${s.displayIndex} ${s.title} ${r.created ? '→ ' + r.$id : '(updated ' + r.$id + ')'}`,
    );
  }
}

async function migrateLogos() {
  log.step(`Client logos (${clientLogos.length})`);
  for (const l of clientLogos) {
    const r = await upsertBy('clientLogo', 'name', l.name, l);
    log[r.created ? 'ok' : 'skip'](
      `${l.name} ${r.created ? '→ ' + r.$id : '(updated ' + r.$id + ')'}`,
    );
  }
}

async function migrateHeroCopy() {
  log.step('Hero copy (siteSettings singleton)');
  try {
    await databases.updateDocument(
      DATABASE_ID,
      'siteSettings',
      'siteSettings',
      heroCopy,
    );
    log.ok('siteSettings updated with hero copy');
  } catch (e: unknown) {
    if (
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as { code: number }).code === 404
    ) {
      // Singleton doesn't exist yet — create with hero copy + minimal contact email.
      const created = await databases.createDocument(
        DATABASE_ID,
        'siteSettings',
        'siteSettings',
        { ...heroCopy, contactEmail: 'cmd@codeminds.digital' },
        docPerms,
      );
      log.ok(`siteSettings created → ${created.$id}`);
    } else {
      throw e;
    }
  }
}

async function main() {
  console.log(`Project:  ${PROJECT_ID}`);
  console.log(`Database: ${DATABASE_ID}`);

  await migrateCapabilities();
  await migrateProcessSteps();
  await migrateLogos();
  await migrateHeroCopy();

  console.log('\nBlocks migration complete');
}

main().catch((e) => {
  console.error('\nMigration failed:', e?.message ?? e);
  process.exit(1);
});
