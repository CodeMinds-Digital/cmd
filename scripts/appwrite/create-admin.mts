/**
 * Bootstrap the first Admin (after that, Admins invite staff from /staff).
 *
 *   ADMIN_URL=https://admin.codeminds.digital npm run appwrite:create-admin -- --email you@example.com --name "Your Name"            dry run
 *   ADMIN_URL=https://admin.codeminds.digital npm run appwrite:create-admin -- --email you@example.com --name "Your Name" --apply    apply
 *
 * Creates the account if it doesn't exist (no password), adds it to the
 * `admin` team, and has Appwrite email a "set your password" link to
 * ADMIN_URL/reset-password (valid 1 hour; ADMIN_URL's host must be a Web
 * platform in the Appwrite project). On first sign-in the admin app requires
 * two-factor setup. Idempotent; never prints secrets.
 */
import { parseArgs } from 'node:util';
import { ID, Query } from 'node-appwrite';
import { createAdminClient } from '../../packages/cms/src/appwrite/server.ts';
import { createPublicClient } from '../../packages/cms/src/appwrite/session.ts';
import { writeAudit } from '../../packages/cms/src/audit.ts';
import { STAFF_TEAMS } from '../../packages/cms/src/roles.ts';
import { retrying } from './retry.mts';

const { values } = parseArgs({ options: { email: { type: 'string' }, name: { type: 'string' }, apply: { type: 'boolean', default: false } } });
const email = values.email?.trim().toLowerCase();
const name = values.name?.trim();
const adminUrl = process.env.ADMIN_URL?.replace(/\/$/, '');
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !name) throw new Error('Usage: --email you@example.com --name "Your Name" [--apply]');
if (!adminUrl || !/^https?:\/\//.test(adminUrl)) throw new Error('Set ADMIN_URL, e.g. https://admin.codeminds.digital');

const admin = createAdminClient();
const [users, teams] = [retrying(admin.users), retrying(admin.teams)];

const existing = (await users.list({ queries: [Query.equal('email', email), Query.limit(1)] })).users[0];
const inTeam = existing
  ? (await teams.listMemberships({ teamId: STAFF_TEAMS.admin, queries: [Query.equal('userId', existing.$id)] })).total > 0
  : false;

console.log(`${values.apply ? 'Applying' : 'Dry run'}: ${email}`);
console.log(`  account: ${existing ? 'exists' : 'create (no password)'}`);
console.log(`  admin team: ${inTeam ? 'already a member' : 'add'}`);
console.log(`  email a set-password link → ${adminUrl}/reset-password`);
if (!values.apply) {
  console.log('Re-run with --apply.');
  process.exit(0);
}

const user = existing ?? (await users.create({ userId: ID.unique(), email, name }));
if (!inTeam) {
  const m = await teams.createMembership({ teamId: STAFF_TEAMS.admin, roles: [], userId: user.$id });
  await writeAudit(admin, { actor: { id: 'script', name: 'create-admin script' }, action: 'staff.invite', tableId: 'teams', rowId: m.$id, label: name, summary: 'First admin (bootstrap)' });
}
await createPublicClient().account.createRecovery({ email, url: `${adminUrl}/reset-password` });
console.log('Done. Check the inbox for the set-password link, then sign in and set up two-factor authentication.');
