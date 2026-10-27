/**
 * Export every row of every table, every Storage file and the schema snapshot
 * to backups/appwrite-<timestamp>/ (restore with restore.mts). Read-only on Appwrite. Run before any
 * migration. backups/ is gitignored: it can contain personal data (enquiries),
 * so delete old exports once you no longer need them.
 *
 *   npm run appwrite:backup
 */
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { BUCKETS } from '../../packages/cms/src/appwrite/assets.ts';
import { Query } from 'node-appwrite';
import { createAdminClient } from '../../packages/cms/src/appwrite/server.ts';
import { retrying } from './retry.mts';

const admin = createAdminClient();
const env = admin.env;
const tablesDB = retrying(admin.tablesDB);
const storage = retrying(admin.storage);
const dir = new URL(`../../backups/appwrite-${new Date().toISOString().replace(/[:.]/g, '-')}/`, import.meta.url);
mkdirSync(dir, { recursive: true });
copyFileSync(new URL('../../appwrite.config.json', import.meta.url), new URL('appwrite.config.json', dir));

const { tables } = await tablesDB.listTables({ databaseId: env.databaseId, queries: [Query.limit(100)] });
for (const t of tables) {
  const rows = [];
  let cursor: string | undefined;
  for (;;) {
    const page = await tablesDB.listRows({
      databaseId: env.databaseId,
      tableId: t.$id,
      queries: [Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])],
    });
    rows.push(...page.rows);
    if (page.rows.length < 100) break;
    cursor = page.rows.at(-1)!.$id;
  }
  writeFileSync(new URL(`${t.$id}.json`, dir), JSON.stringify(rows, null, 2) + '\n');
  console.log(`${t.$id}: ${rows.length} rows`);
}
// Files: raw bytes + a manifest (name, type) so IDs can be restored exactly.
const filesDir = new URL('files/', dir);
mkdirSync(filesDir, { recursive: true });
const manifest: { bucketId: string; $id: string; name: string; mimeType: string; sizeOriginal: number }[] = [];
for (const bucketId of Object.values(BUCKETS)) {
  let cursor: string | undefined;
  for (;;) {
    const page = await storage.listFiles({ bucketId, queries: [Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])] });
    for (const f of page.files) {
      const bytes = await storage.getFileDownload({ bucketId, fileId: f.$id });
      writeFileSync(new URL(`${bucketId}--${f.$id}`, filesDir), Buffer.from(bytes));
      manifest.push({ bucketId, $id: f.$id, name: f.name, mimeType: f.mimeType, sizeOriginal: f.sizeOriginal });
    }
    if (page.files.length < 100) break;
    cursor = page.files.at(-1)!.$id;
  }
}
writeFileSync(new URL('files.json', dir), JSON.stringify(manifest, null, 2) + '\n');
console.log(`files: ${manifest.length}`);
console.log(`Backup written to ${dir.pathname}`);
