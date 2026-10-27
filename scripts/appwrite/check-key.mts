/**
 * Probe an API key's real scopes against the least-privilege set for a role.
 * Every probe is harmless: reads with limit 1, or writes aimed at IDs that
 * don't exist (Appwrite checks the scope first: 404 = allowed, 401 = refused).
 *
 *   npm run appwrite:check-key -- --role site            (key from APPWRITE_API_KEY)
 *   npm run appwrite:check-key -- --role admin --env APPWRITE_ADMIN_KEY
 *
 *   site   rows.read, rows.write                        — page reads, enquiry writes
 *   admin  sessions.write, users.read, users.write,
 *          teams.read, teams.write, rows.write          — sign-in, staff, audit log
 * Anything else the key can do is reported as too broad. Never prints the key.
 */
import { parseArgs } from 'node:util';
import { AppwriteException, Account, Client, Functions, Query, Storage, TablesDB, Teams, Users } from 'node-appwrite';
import { readPublicEnv } from '../../packages/cms/src/env.ts';
import './retry.mts';

const { values } = parseArgs({ options: { role: { type: 'string' }, env: { type: 'string', default: 'APPWRITE_API_KEY' } } });
const role = values.role;
if (role !== 'site' && role !== 'admin') throw new Error('--role site|admin');
const key = process.env[values.env!];
if (!key) throw new Error(`${values.env} is not set.`);

const env = readPublicEnv();
const client = new Client().setEndpoint(env.endpoint).setProject(env.projectId).setKey(key);
const db = env.databaseId;
const [tablesDB, users, teams, account, functions, storage] = [new TablesDB(client), new Users(client), new Teams(client), new Account(client), new Functions(client), new Storage(client)];
const GHOST = 'zz-scope-probe-does-not-exist';

/** true = the key holds the scope (call succeeded or failed for a reason other than scope). */
async function allowed(call: () => Promise<unknown>) {
  try {
    await call();
    return true;
  } catch (e) {
    if (!(e instanceof AppwriteException)) throw e;
    return !(e.code === 401 && /scope|unauthorized/.test(e.type));
  }
}

const PROBES: Record<string, () => Promise<unknown>> = {
  'rows.read': () => tablesDB.listRows({ databaseId: db, tableId: 'caseStudy', queries: [Query.limit(1)] }),
  'rows.write': () => tablesDB.updateRow({ databaseId: db, tableId: 'auditLog', rowId: GHOST, data: {} }),
  'sessions.write': () => account.createEmailPasswordSession({ email: `${GHOST}@example.invalid`, password: 'not-a-real-password-0' }),
  'users.read': () => users.list({ queries: [Query.limit(1)] }),
  'users.write': () => users.updateName({ userId: GHOST, name: 'x' }),
  'teams.read': () => teams.list({ queries: [Query.limit(1)] }),
  'teams.write': () => teams.deleteMembership({ teamId: 'admin', membershipId: GHOST }),
  'tables.read': () => tablesDB.listTables({ databaseId: db, queries: [Query.limit(1)] }),
  'tables.write': () => tablesDB.deleteTable({ databaseId: db, tableId: GHOST }),
  'functions.read': () => functions.list({ queries: [Query.limit(1)] }),
  'buckets.read': () => storage.listBuckets({ queries: [Query.limit(1)] }),
  'files.write': () => storage.deleteFile({ bucketId: 'public-assets', fileId: GHOST }),
};

const NEED: Record<'site' | 'admin', string[]> = {
  site: ['rows.read', 'rows.write'],
  admin: ['sessions.write', 'users.read', 'users.write', 'teams.read', 'teams.write', 'rows.write'],
};

let problems = 0;
console.log(`Key in ${values.env} as the ${role} key:`);
for (const [scope, probe] of Object.entries(PROBES)) {
  const has = await allowed(probe);
  const needed = NEED[role].includes(scope);
  const verdict = has === needed ? 'ok   ' : needed ? 'MISSING' : 'TOO BROAD';
  if (has !== needed) problems++;
  console.log(`  ${verdict.padEnd(9)} ${scope}${has ? '' : ' (refused)'}`);
}
console.log(problems ? `\n${problems} problem(s): adjust the key's scopes in the Appwrite Console.` : '\nLeast privilege: OK.');
process.exit(problems ? 1 : 0);
