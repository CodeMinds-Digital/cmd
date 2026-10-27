# Runbooks

All `npm run appwrite:*` scripts read `.env.local`, dry-run unless given `--apply`, and never print secrets. Run them from the repo root on a machine you trust.

## Keys and secrets

| Name | Where | Scopes / purpose |
|---|---|---|
| Site API key (`APPWRITE_API_KEY` in the **site** service) | Dokploy runtime env + build-time secret | `rows.read`, `rows.write` |
| Admin API key (`APPWRITE_API_KEY` in the **admin** service) | Dokploy runtime env | `sessions.write`, `users.read`, `users.write`, `teams.read`, `teams.write`, `rows.write` |
| Scripts key (`APPWRITE_API_KEY` in your `.env.local` only) | Your machine — never deployed | Schema, backup/restore, functions (broad) |
| `APPWRITE_WEBHOOK_SECRET` | Site env + `revalidate-site` variable | Signs revalidation requests |
| `PREVIEW_SECRET` | Site + admin env | Signs 10-minute preview links |
| `IP_HASH_SALT` | Site env | Keyed hash of enquiry IPs |

Check a key really is least-privilege: `npm run appwrite:check-key -- --role site --env SITE_KEY_VAR` (or `--role admin`). It only probes with harmless calls.

**Rotate a key** (suspected leak, staff departure with access, yearly): create the new key in Console → put it in Dokploy (and the build secret for the site) → redeploy → `appwrite:check-key` → delete the old key in Console. A leaked key in git history must be **revoked**, not just removed from the file.

**Rotate `APPWRITE_WEBHOOK_SECRET`**: set the new value in the site env, redeploy, then `npm run appwrite:function -- --fn revalidate-site --apply` with the new value in `.env.local`. Edits made in between still go live within the hourly safety net.

**Rotate `PREVIEW_SECRET`**: same value in site and admin; open preview links stop working (they expire in 10 minutes anyway).

**Rotate `IP_HASH_SALT`**: only breaks matching new enquiries to old ones by IP. Nothing else.

## Staff

- **First Admin:** `ADMIN_URL=https://admin.codeminds.digital npm run appwrite:create-admin -- --email … --name "…" --apply` → set a password from the email → sign in → set up two-factor.
- **Invite / change role / remove:** Admin → Staff. Removing or changing someone signs them out everywhere. There is always at least one Admin; nobody can change themselves.
- **Lost authenticator:** the person signs in with a recovery code. If they have none, an Admin removes and re-invites them (two-factor must be set up again).

## Backup

- `npm run appwrite:backup` → `backups/appwrite-<timestamp>/` (every row, every Storage file, schema snapshot). Run **weekly** and before every schema change or migration.
- Backups contain personal data (enquiries). `backups/` is gitignored; copy each backup to encrypted storage you control, and **delete backups older than 24 months** (same rule as enquiries).
- Not in backups: user accounts, passwords, sessions and team memberships (Appwrite doesn't export them). After a restore, re-invite staff.
- The Appwrite Cloud plan in use has no managed backups; these exports are the backup.

## Restore

- **Drill** (quarterly; ~1 minute; safe in production): restores into no-access tables prefixed `zz_drill_`, verifies every row, deletes them:
  `npm run appwrite:restore -- --from backups/appwrite-<ts> --prefix zz_drill_ --tables caseStudy,caseApproachStep,journalPost,stackItem,capabilityGroup,siteSettings --cleanup --apply`
  Last run: 2026-10-27 — 6 tables, 46 rows, all verified.
- **Disaster recovery** (data lost or project unusable): create a fresh Appwrite project (or empty the database), create a key there, then
  `RESTORE_ENDPOINT=… RESTORE_PROJECT_ID=… RESTORE_DATABASE_ID=… RESTORE_API_KEY=… npm run appwrite:restore -- --from backups/appwrite-<ts> --keep-permissions --apply`.
  Then recreate the bucket (`appwrite:schema` creates it), point the site/admin env at the new project, redeploy, deploy both Functions (`appwrite:function -- --fn … --apply`), re-invite staff. The script never overwrites existing tables.

## Schema changes

1. Edit `scripts/appwrite/schema.mts` (additive only: new tables/columns/indexes, permissions).
2. `npm run appwrite:backup`
3. `npm run appwrite:schema` (read the dry run) → `npm run appwrite:schema -- --apply` → run again: must say `0 change(s) pending`.
4. `npm run appwrite:pull && npm run appwrite:docs`, commit the snapshot, types and docs.
5. Removing columns/tables is a separate, confirmed step (expand → migrate → contract): back up, migrate data, ship code that no longer reads it, then delete.

## Incidents

- **Leaked API key:** revoke it in Console immediately, create a replacement (see Rotate), check the audit log and recent rows for unexpected changes, restore affected tables from the last good backup into a drill prefix to compare.
- **Compromised staff account:** Admin → Staff → Remove (signs them out everywhere). Review Audit log for their actions; republish or restore anything they changed.
- **Spam flood on the contact form:** rate limits apply per IP (in memory, per container). Mark spam in the inbox (Status → Spam); delete in bulk via CSV review if needed. If sustained, add a CAPTCHA (not built).
- **Edits not appearing on the site:** Appwrite Console → Functions → revalidate-site → Executions: each should log `→ 200`. 401 = webhook secret mismatch; 404 = site route missing (old deploy); timeouts = site down. Pages also refresh hourly on their own.
- **Retention job:** Functions → retention-enquiries → Executions (daily). Dry run any time: execute with body `{"dryRun": true}`.

## Pending clean-up (needs your confirmation — deletes data)

Legacy items kept during the migration, unused by any code: columns `caseStudy.approachJson/screensJson/metricsJson/reviewedBy/reviewedAt/scheduledFor`, `journalPost.scheduledFor/authorId/reviewedBy/reviewedAt`, the old hero/logo/OG columns on `siteSettings`, `lead.message` (superseded by `messageBody` — needs `message` made optional first), tables `navItem` and `teamMember` (empty), teams `writer` and `viewer` (empty), and the 8 unused indexes in [indexes.md](indexes.md).
