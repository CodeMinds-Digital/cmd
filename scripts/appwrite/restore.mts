/**
 * Restore a backup (backup.mts output) into EMPTY tables, then verify every
 * row against the backup. Never overwrites: it refuses if a target table
 * already exists.
 *
 * Real restore (disaster recovery) — into another project / a fresh database:
 *   RESTORE_ENDPOINT=… RESTORE_PROJECT_ID=… RESTORE_DATABASE_ID=… RESTORE_API_KEY=… \
 *   npm run appwrite:restore -- --from backups/appwrite-<ts> --keep-permissions --apply
 *
 * Drill in the live project (one database on the current plan): restore into
 * prefixed copies with no access, verify, delete them:
 *   npm run appwrite:restore -- --from backups/appwrite-<ts> --prefix zz_drill_ \
 *     --tables caseStudy,caseApproachStep,journalPost --cleanup --apply
 * Without RESTORE_* variables a prefix is mandatory, so live tables can't be touched.
 *
 * Column types are recreated from the schema snapshot; legacy `string`
 * columns (deprecated since 1.9.0) become varchar (≤ 768, indexable), text or
 * mediumtext. Row IDs are preserved; $createdAt/$updatedAt are not.
 * Users, sessions and team memberships are not in backups: re-invite staff.
 */
import { readFileSync, existsSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { AppwriteException, Client, Query, Storage, TablesDB, TablesDBIndexType } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { readServerEnv } from '../../packages/cms/src/env.ts';
import { retrying } from './retry.mts';

const { values } = parseArgs({
  options: {
    from: { type: 'string' },
    tables: { type: 'string' },
    prefix: { type: 'string', default: '' },
    'keep-permissions': { type: 'boolean', default: false },
    cleanup: { type: 'boolean', default: false },
    apply: { type: 'boolean', default: false },
  },
});
if (!values.from || !existsSync(`${values.from}/appwrite.config.json`)) throw new Error('--from must be a backup directory (with appwrite.config.json).');
const dir = values.from.replace(/\/$/, '');
const prefix = values.prefix!;
if (prefix && !/^[a-z0-9_]{1,10}$/.test(prefix)) throw new Error('--prefix: up to 10 of a-z 0-9 _');

const live = readServerEnv();
const target = process.env.RESTORE_PROJECT_ID
  ? { endpoint: process.env.RESTORE_ENDPOINT ?? live.endpoint, projectId: process.env.RESTORE_PROJECT_ID, databaseId: process.env.RESTORE_DATABASE_ID ?? live.databaseId, apiKey: process.env.RESTORE_API_KEY ?? '' }
  : live;
const sameDatabase = target.projectId === live.projectId && target.databaseId === live.databaseId;
if (sameDatabase && !prefix) throw new Error('Refusing to restore into the live database without --prefix (it would collide with live tables).');
if (!target.apiKey) throw new Error('RESTORE_API_KEY is not set.');

const client = new Client().setEndpoint(target.endpoint).setProject(target.projectId).setKey(target.apiKey);
const db = retrying(new TablesDB(client));
const storage = retrying(new Storage(client));
const databaseId = target.databaseId;

type Column = { key: string; type: string; size?: number; required: boolean; array?: boolean; default?: unknown; format?: string; elements?: string[]; min?: number; max?: number };
type TableSnap = { $id: string; name: string; $permissions: string[]; columns: Column[]; indexes: { key: string; type: string; columns: string[]; orders?: string[]; lengths?: number[] }[] };
const snapshot = JSON.parse(readFileSync(`${dir}/appwrite.config.json`, 'utf8')) as { tables: TableSnap[] };
const wanted = values.tables ? new Set(values.tables.split(',')) : null;
const tables = snapshot.tables.filter((t) => !wanted || wanted.has(t.$id));
if (wanted && tables.length !== wanted.size) throw new Error(`Unknown table(s) in --tables: ${[...wanted].filter((w) => !tables.some((t) => t.$id === w)).join(', ')}`);

const SYSTEM = new Set(['$id', '$createdAt', '$updatedAt', '$permissions', '$tableId', '$databaseId', '$sequence', '$collectionId']);
const strip = (r: Record<string, unknown>) => Object.fromEntries(Object.entries(r).filter(([k]) => !SYSTEM.has(k)).sort(([a], [b]) => a.localeCompare(b)));
const canonical = (rows: Record<string, unknown>[]) => JSON.stringify(rows.map((r) => [r.$id, strip(r)]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));

function createColumn(tableId: string, c: Column) {
  const base = { databaseId, tableId, key: c.key, required: c.required, array: c.array ?? false };
  const xdefault = c.required ? null : ((c.default ?? null) as never);
  if (c.format === 'enum' || c.type === 'enum') return db.createEnumColumn({ ...base, elements: c.elements ?? [], xdefault });
  if (c.format === 'email') return db.createEmailColumn({ ...base, xdefault });
  if (c.format === 'url') return db.createUrlColumn({ ...base, xdefault });
  switch (c.type) {
    case 'string': {
      const size = c.size ?? 255;
      if (size <= 768) return db.createVarcharColumn({ ...base, size, xdefault });
      return size <= 16_383 ? db.createTextColumn({ ...base, xdefault }) : db.createMediumtextColumn({ ...base, xdefault });
    }
    case 'varchar':
      return db.createVarcharColumn({ ...base, size: c.size ?? 255, xdefault });
    case 'text':
      return db.createTextColumn({ ...base, xdefault });
    case 'mediumtext':
      return db.createMediumtextColumn({ ...base, xdefault });
    case 'longtext':
      return db.createLongtextColumn({ ...base, xdefault });
    case 'integer':
      return db.createIntegerColumn({ ...base, min: c.min, max: c.max, xdefault });
    case 'double':
    case 'float':
      return db.createFloatColumn({ ...base, min: c.min, max: c.max, xdefault });
    case 'boolean':
      return db.createBooleanColumn({ ...base, xdefault });
    case 'datetime':
      return db.createDatetimeColumn({ ...base, xdefault });
  }
  throw new Error(`Unsupported column type ${c.type} (${tableId}.${c.key})`);
}

async function waitFor(tableId: string, what: 'columns' | 'indexes') {
  for (let i = 0; i < 120; i++) {
    const t = await db.getTable({ databaseId, tableId });
    const items = (t[what] as { key: string; status: string; error?: string }[]) ?? [];
    const failed = items.filter((x) => x.status === 'failed');
    if (failed.length) throw new Error(`${tableId}: ${what} failed: ${failed.map((x) => `${x.key} (${x.error})`).join(', ')}`);
    if (items.every((x) => x.status === 'available')) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${tableId}: ${what} not available after 120 s`);
}

console.log(`${values.apply ? 'Restoring' : 'Dry run'}: ${dir} → project ${target.projectId}, database ${databaseId}${prefix ? `, tables prefixed "${prefix}"` : ''}`);
for (const t of tables) {
  const id = prefix + t.$id;
  if (id.length > 36) throw new Error(`Table ID too long with prefix: ${id}`);
  const exists = await db.getTable({ databaseId, tableId: id }).then(() => true, (e) => (e instanceof AppwriteException && e.code === 404 ? false : Promise.reject(e)));
  if (exists) throw new Error(`Target table ${id} already exists; restore only into empty targets.`);
  const rows = JSON.parse(readFileSync(`${dir}/${t.$id}.json`, 'utf8')) as Record<string, unknown>[];
  console.log(`  ${id}: ${t.columns.length} columns, ${t.indexes.length} indexes, ${rows.length} rows`);
}
const fileManifest = existsSync(`${dir}/files.json`) ? (JSON.parse(readFileSync(`${dir}/files.json`, 'utf8')) as { bucketId: string; $id: string; name: string }[]) : [];
if (!sameDatabase) console.log(`  files: ${fileManifest.length}`);
if (!values.apply) {
  console.log('Re-run with --apply.');
  process.exit(0);
}

const created: string[] = [];
let failures = 0;
try {
  for (const t of tables) {
    const id = prefix + t.$id;
    // Drills get no access at all; a real restore keeps the snapshot's permissions.
    await db.createTable({ databaseId, tableId: id, name: `${prefix ? '[drill] ' : ''}${t.name}`.slice(0, 128), permissions: values['keep-permissions'] ? t.$permissions : [], rowSecurity: false });
    created.push(id);
    for (const c of t.columns) await createColumn(id, c);
    await waitFor(id, 'columns');
    for (const idx of t.indexes) {
      await db.createIndex({ databaseId, tableId: id, key: idx.key, type: idx.type as TablesDBIndexType, columns: idx.columns, orders: idx.orders as never, lengths: idx.lengths });
    }
    await waitFor(id, 'indexes');

    const rows = JSON.parse(readFileSync(`${dir}/${t.$id}.json`, 'utf8')) as Record<string, unknown>[];
    for (const r of rows) await db.createRow({ databaseId, tableId: id, rowId: String(r.$id), data: strip(r) });

    const back: Record<string, unknown>[] = [];
    let cursor: string | undefined;
    for (;;) {
      const page = await db.listRows({ databaseId, tableId: id, queries: [Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])] });
      back.push(...page.rows);
      if (page.rows.length < 100) break;
      cursor = page.rows.at(-1)!.$id;
    }
    const same = canonical(back) === canonical(rows);
    if (!same) failures++;
    console.log(`  ${same ? 'verified' : 'MISMATCH'} ${id}: ${back.length}/${rows.length} rows`);
  }
  if (!sameDatabase) {
    for (const f of fileManifest) {
      await storage.createFile({ bucketId: f.bucketId, fileId: f.$id, file: InputFile.fromPath(`${dir}/files/${f.bucketId}--${f.$id}`, f.name) });
    }
    console.log(`  files restored: ${fileManifest.length}`);
  }
} finally {
  if (values.cleanup) {
    for (const id of created) await db.deleteTable({ databaseId, tableId: id }).catch((e) => console.error(`  could not delete ${id}: ${(e as Error).message}`));
    console.log(`  cleanup: deleted ${created.length} drill table(s)`);
  }
}
console.log(failures ? `\n${failures} table(s) did not verify.` : '\nRestore verified: every row matches the backup.');
process.exit(failures ? 1 : 0);
