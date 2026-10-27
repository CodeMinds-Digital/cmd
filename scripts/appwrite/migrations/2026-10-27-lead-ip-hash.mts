/**
 * One-off: replace raw IPs on `lead` rows with a keyed hash, then drop the
 * `lead.ipAddress` column (expand → migrate → contract in one go; nothing
 * deployed reads or writes that column).
 *
 *   npm run appwrite:migrate:lead-ip              dry run
 *   npm run appwrite:migrate:lead-ip -- --apply   apply
 *
 * Needs IP_HASH_SALT and a backup (npm run appwrite:backup). Re-runnable: rows
 * already hashed are skipped, and the column drop only runs once every row
 * with an IP has a hash. Never prints IPs.
 */
import { Query } from 'node-appwrite';
import { createAdminClient } from '../../../packages/cms/src/appwrite/server.ts';
import { retrying } from '../retry.mts';
import { hashIp } from '../../../packages/cms/src/privacy/ip-hash.ts';

const APPLY = process.argv.includes('--apply');
const admin = createAdminClient();
const env = admin.env;
const tablesDB = retrying(admin.tablesDB);
const databaseId = env.databaseId;
const tableId = 'lead';

hashIp('0.0.0.0'); // fail fast if the salt is missing

const table = await tablesDB.getTable({ databaseId, tableId });
const hasIpColumn = (table.columns as { key: string }[]).some((c) => c.key === 'ipAddress');
if (!hasIpColumn) {
  console.log('lead.ipAddress already removed; nothing to do.');
  process.exit(0);
}

const { rows } = await tablesDB.listRows({ databaseId, tableId, queries: [Query.isNotNull('ipAddress'), Query.limit(100)] });
const todo = rows.filter((r) => !r.ipHash);
console.log(`${APPLY ? 'Applying' : 'Dry run'}: ${rows.length} row(s) hold a raw IP, ${todo.length} need a hash.`);

for (const r of todo) {
  console.log(`  hash ip on lead ${r.$id}`);
  if (APPLY) await tablesDB.updateRow({ databaseId, tableId, rowId: r.$id, data: { ipHash: hashIp(String(r.ipAddress)) } });
}

console.log('  delete column lead.ipAddress');
if (APPLY) {
  const check = await tablesDB.listRows({ databaseId, tableId, queries: [Query.isNotNull('ipAddress'), Query.isNull('ipHash'), Query.limit(1)] });
  if (check.total) throw new Error(`${check.total} row(s) still have an IP but no hash; not dropping the column.`);
  await tablesDB.deleteColumn({ databaseId, tableId, key: 'ipAddress' });
  console.log('Done.');
} else {
  console.log('Re-run with --apply.');
}
