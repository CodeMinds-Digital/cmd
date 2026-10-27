/**
 * Create/update and deploy an Appwrite Function from appwrite/functions/<id>.
 *
 *   npm run appwrite:function -- --fn revalidate-site            dry run
 *   npm run appwrite:function -- --fn retention-enquiries --apply
 *
 * revalidate-site      Row create/update/delete on every table that feeds a public page
 *                      (CACHE_TAGS) → signed POST to the site's /api/revalidate.
 *                      Variables: SITE_REVALIDATE_URL, REVALIDATE_SECRET (= APPWRITE_WEBHOOK_SECRET).
 * retention-enquiries  Daily (every 1,440 minutes; Appwrite picks the time — cron needs a paid
 *                      plan): deletes enquiries not updated for 24 months.
 *                      Execution key scopes: rows.read, rows.write. Variables: DATABASE_ID, RETENTION_MONTHS.
 *
 * No execute permission for anyone (triggers only; the API key / Console can still run them).
 * Secrets are never printed.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { Functions, ProjectKeyScopes, Runtime } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { createAdminClient } from '../../packages/cms/src/appwrite/server.ts';
import { tagForTable } from '../../packages/cms/src/cache-tags.ts';
import { TABLES } from '../../packages/cms/src/schema/generated.ts';
import { retrying } from './retry.mts';

const { values } = parseArgs({ options: { fn: { type: 'string' }, apply: { type: 'boolean', default: false } } });
const APPLY = values.apply;
const admin = createAdminClient();
const { env } = admin;
const functions = retrying(new Functions(admin.client));

type Spec = {
  name: string;
  events: string[];
  /** Minutes between runs (0 = not scheduled). Cron schedules need a paid Appwrite plan. */
  interval: number;
  timeout: number;
  scopes: ProjectKeyScopes[];
  variables: [key: string, value: string, secret: boolean][];
};

function revalidateSite(): Spec {
  const secret = process.env.APPWRITE_WEBHOOK_SECRET;
  const site = process.env.REVALIDATE_TARGET_URL ?? (process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/api/revalidate` : '');
  if (!secret || secret.length < 32) throw new Error('APPWRITE_WEBHOOK_SECRET is missing or shorter than 32 characters.');
  if (!/^https:\/\//.test(site)) throw new Error('Revalidate URL must be https (set NEXT_PUBLIC_SITE_URL or REVALIDATE_TARGET_URL).');
  return {
    name: 'Revalidate site',
    events: Object.values(TABLES).filter((t) => tagForTable(t)).sort().map((t) => `databases.${env.databaseId}.tables.${t}.rows.*`),
    interval: 0,
    timeout: 15,
    scopes: [],
    variables: [
      ['SITE_REVALIDATE_URL', site, false],
      ['REVALIDATE_SECRET', secret, true],
    ],
  };
}

function retentionEnquiries(): Spec {
  return {
    name: 'Enquiry retention',
    events: [],
    interval: 1440,
    timeout: 60,
    scopes: [ProjectKeyScopes.RowsRead, ProjectKeyScopes.RowsWrite],
    variables: [
      ['DATABASE_ID', env.databaseId, false],
      ['RETENTION_MONTHS', '24', false],
    ],
  };
}

const SPECS: Record<string, () => Spec> = { 'revalidate-site': revalidateSite, 'retention-enquiries': retentionEnquiries };
const functionId = values.fn ?? '';
if (!SPECS[functionId]) throw new Error(`--fn must be one of: ${Object.keys(SPECS).join(', ')}`);
const spec = SPECS[functionId]();
const source = fileURLToPath(new URL(`../../appwrite/functions/${functionId}`, import.meta.url));

const settings = {
  functionId,
  name: spec.name,
  runtime: Runtime.Node22,
  execute: [] as string[],
  events: spec.events,
  interval: spec.interval,
  timeout: spec.timeout,
  scopes: spec.scopes,
  enabled: true,
  logging: true,
  entrypoint: 'src/main.js',
  commands: '',
};

console.log(`${APPLY ? 'Applying' : 'Dry run'}: function "${functionId}"`);
if (spec.events.length) console.log(`  events (${spec.events.length}): ${spec.events.map((e) => e.split('.')[3]).join(', ')}`);
if (spec.interval) console.log(`  runs every ${spec.interval} minutes`);
if (spec.scopes.length) console.log(`  execution key scopes: ${spec.scopes.join(', ')}`);

const existing = await functions.get({ functionId }).catch(() => undefined);
console.log(`  ${existing ? 'update' : 'create'} function settings`);
if (APPLY) await (existing ? functions.update(settings) : functions.create(settings));

const vars = APPLY || existing ? (await functions.listVariables({ functionId }).catch(() => ({ variables: [] }))).variables : [];
for (const [key, value, isSecret] of spec.variables) {
  const v = vars.find((x) => x.key === key);
  console.log(`  ${v ? 'update' : 'create'} variable ${key}${isSecret ? ' (secret)' : ` = ${value}`}`);
  if (!APPLY) continue;
  if (v) await functions.updateVariable({ functionId, variableId: v.$id, key, value, secret: isSecret });
  else await functions.createVariable({ functionId, variableId: key.toLowerCase().replace(/_/g, '-'), key, value, secret: isSecret });
}

console.log('  upload deployment (activate)');
if (APPLY) {
  const archive = join(mkdtempSync(join(tmpdir(), 'fn-')), 'code.tar.gz');
  execFileSync('tar', ['-czf', archive, '-C', source, '.']);
  const d = await functions.createDeployment({ functionId, code: InputFile.fromPath(archive, 'code.tar.gz'), activate: true });
  console.log(`  deployment ${d.$id}: ${d.status}`);
}
if (!APPLY) console.log('Re-run with --apply.');
