/**
 * Read-only compatibility and safety check of the configured Appwrite project.
 *
 *   npm run appwrite:check
 *
 * Fails (exit 1) when the site cannot work: bad env, unreachable server, server
 * older than the SDK targets, key rejected, database or tables missing.
 * Warns about schema/permission risks that need a decision; it never changes
 * anything. Secrets are never printed.
 */
import { readFileSync } from 'node:fs';
import { Query } from 'node-appwrite';
import { createAdminClient } from '../../packages/cms/src/appwrite/server.ts';
import { TABLES } from '../../packages/cms/src/schema/generated.ts';
import { retrying } from './retry.mts';

// Response format the installed node-appwrite sends (it targets this server line).
const SDK_TARGET = '2.5.0';

const failures: string[] = [];
const warnings: string[] = [];
const ok = (msg: string) => console.log(`  ok    ${msg}`);
const fail = (msg: string) => (failures.push(msg), console.log(`  FAIL  ${msg}`));
const warn = (msg: string) => (warnings.push(msg), console.log(`  warn  ${msg}`));

const cmp = (a: string, b: string) => {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));
  for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
};

let admin;
try {
  admin = createAdminClient();
  ok('environment variables present and well-formed');
} catch (e) {
  fail((e as Error).message);
  process.exit(1);
}
const { env } = admin;
const [tablesDB, storage] = [retrying(admin.tablesDB), retrying(admin.storage)];

const sdkVersion = JSON.parse(
  readFileSync(new URL('../../node_modules/node-appwrite/package.json', import.meta.url), 'utf8'),
).version;

try {
  const res = await fetch(`${env.endpoint}/health/version`, { signal: AbortSignal.timeout(10_000) });
  const { version } = (await res.json()) as { version: string };
  if (cmp(version, SDK_TARGET) >= 0) ok(`server ${version} ≥ node-appwrite ${sdkVersion} target ${SDK_TARGET}`);
  else fail(`server ${version} is older than node-appwrite ${sdkVersion} target ${SDK_TARGET}; use an older SDK`);
} catch (e) {
  fail(`cannot reach ${env.endpoint}/health/version (${(e as Error).message})`);
}

try {
  const db = await tablesDB.get({ databaseId: env.databaseId });
  ok(`API key accepted; database "${db.$id}" reachable through TablesDB`);
  if (db.type === 'legacy') warn(`database "${db.$id}" is type "legacy" (created via the deprecated Databases API); works with TablesDB, no action needed`);
} catch (e) {
  fail(`database "${env.databaseId}": ${(e as Error).message}`);
}

const { tables } = await tablesDB.listTables({ databaseId: env.databaseId, queries: [Query.limit(100)] }).catch(() => ({ tables: [] }));
const live = new Map(tables.map((t) => [t.$id, t]));
for (const id of Object.values(TABLES)) {
  const t = live.get(id);
  if (!t) { fail(`table "${id}" from generated.ts is missing on the server (re-run appwrite:pull)`); continue; }
  const pending = t.columns.filter((c) => c.status !== 'available').map((c) => `${c.key}(${c.status})`);
  if (pending.length) fail(`table "${id}" has unavailable columns: ${pending.join(', ')}`);
}
if (!failures.some((f) => f.startsWith('table'))) ok(`all ${Object.keys(TABLES).length} tables present, all columns available`);

// ── Risks (decisions, not failures) ──────────────────────────────────────
const legacyString = tables.reduce((n, t) => n + t.columns.filter((c) => c.type === 'string' && (c as { format?: string }).format !== 'enum').length, 0);
if (legacyString) warn(`${legacyString} columns use the "string" type (deprecated since 1.9.0; existing columns keep working, new ones should be varchar/text/mediumtext)`);
for (const t of tables) {
  const open = t.$permissions.filter((p) => p.includes('"any"') || p.includes('"users"') || p.includes('"guests"'));
  if (open.length) warn(`table "${t.$id}" grants access to anyone/any user: ${open.join(', ')} (plan: no Role.any() on tables)`);
  if (t.columns.some((c) => c.key === 'ipAddress')) warn(`table "${t.$id}" has an "ipAddress" column (raw IPs are personal data; the plan stores a salted hash)`);
}
const { buckets } = await storage.listBuckets({ queries: [Query.limit(100)] }).catch(() => ({ buckets: [] }));
for (const b of buckets) {
  if (b.allowedFileExtensions.includes('svg')) warn(`bucket "${b.$id}" accepts SVG uploads (SVG can carry scripts)`);
  if (!b.antivirus) warn(`bucket "${b.$id}" has antivirus off`);
}

console.log(`\n${failures.length} failure(s), ${warnings.length} warning(s).`);
process.exit(failures.length ? 1 : 0);
