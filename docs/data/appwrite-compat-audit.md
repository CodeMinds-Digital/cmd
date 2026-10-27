# Appwrite compatibility audit (Phase 0)

**Date:** 2026-10-27 · **Re-check any time:** `npm run appwrite:check` (read-only)

## Versions

| | Found | Target | Verdict |
|---|---|---|---|
| Appwrite server (Cloud, `sgp` region) | **2.6.2** (`/health/version`) | — | |
| `node-appwrite` (server SDK) | none on this branch; `^24.0.0` on `backend-cms` (response format 1.9.4) | **31.0.0** (response format 2.5.0, "targets server 2.5.x") | Installed in `packages/cms`. Newer server than SDK target is supported; `appwrite:check` fails if the server is ever older |
| `appwrite` (web SDK) | `^25.0.0` on `backend-cms` | 29.1.0 | **Not installed.** Plan D5: no Appwrite calls from browsers; the admin uses server-side sessions (SSR) |
| Appwrite CLI | not installed | 28.9.0 | Optional; `appwrite.config.json` is in CLI format for when you run `appwrite login` |

## Where the existing integration lives

This branch (`assets-name-show`) had **no Appwrite code**. The existing integration is on the **`backend-cms`** branch, about 18k lines, built for the earlier site design. That includes `src/lib/appwrite/*`, `src/lib/cms/*`, the `/admin` routes, `/api/contact`, `/api/revalidate`, `/api/cron/publish-scheduled` and `scripts/*`.

The live project matches that branch:
- database `cmd_website_db` (type `legacy`);
- 11 tables;
- bucket `public-assets`;
- teams `admin`, `editor`, `writer` and `viewer`, each with no members;
- 0 users;
- 0 functions.

Live rows (content and personal data):

| Table | Rows |
|---|---|
| `caseStudy` | 3 |
| `journalPost` | 3 |
| `capability` | 4 |
| `processStep` | 4 |
| `clientLogo` | 6 |
| `testimonial` | 1 |
| `siteSettings` | 1 |
| `auditLog` | 2 |
| `lead` | **2** (personal data) |

## Deprecated APIs and their replacements

Verified against the `@deprecated` tags in `node-appwrite@31.0.0`.

| Deprecated (used on `backend-cms`) | Since | Replacement |
|---|---|---|
| `Databases` service: `listDocuments`, `getDocument`, `createDocument`, `updateDocument`, `deleteDocument` | server 1.8.0 | `TablesDB`: `listRows`, `getRow`, `createRow`, `updateRow` (or `upsertRow`), `deleteRow` |
| `Databases.create`, `get`, `createCollection`, `getCollection`, `listCollections`, `listAttributes` | 1.8.0 | `TablesDB.create`, `get`, `createTable`, `getTable`, `listTables`, `listColumns` |
| `create{String,Email,Url,Integer,Boolean,Datetime}Attribute`, `createIndex` (Databases) | 1.8.0 | `TablesDB.create{Varchar,Text,Email,Url,Integer,Boolean,Datetime}Column`, `TablesDB.createIndex` |
| `string` column / attribute type (`createStringAttribute`, `createStringColumn`) | **1.9.0** | `varchar` (indexable, at most 16,383 characters), `text`, `mediumtext`, `longtext` |
| Positional arguments on every service method, e.g. `createDocument(db, coll, id, data, perms)` | SDK 18+ (`node-appwrite` 31 marks it) | Object parameters, e.g. `createRow({ databaseId, tableId, rowId, data, permissions })` |
| `Account.createMfaChallenge`, `updateMfaChallenge` and the other `*Mfa*` methods | 1.8.0 | `createMFAChallenge`, `updateMFAChallenge`, and the other `*MFA*` methods (needed for admin two-factor in Phase 2) |
| Response field names: `documents`, `$collectionId`, `attributes` | 1.8.0 | `rows`, `$tableId`, `columns` |

### Not a deprecation, but a real bug: admin sign-in could never work

On `backend-cms/src/app/admin/login/actions.ts:20-26`, the session is created by a client that has no API key. Appwrite returns the session `secret` only to a request made with an API key. So the cookie was always set to an empty value, and every request after sign-in counted as signed out.

Fixed in `packages/cms/src/appwrite/session.ts` (`signInWithPassword`). It signs in with the admin client and then makes every request as that user.

### `backend-cms` call sites to migrate when each file is ported

These are ported in Phases 1–5, when each file moves into the site, `admin/` or `packages/cms`. They are not edited on the old branch, because that branch's site design is being replaced.

| Area | Files (on `backend-cms`) | Phase |
|---|---|---|
| Clients and env | `src/lib/appwrite/{client,server,session,env,url-for-asset}.ts` | **0 (done)**, now in `packages/cms` |
| Site reads | `src/lib/cms/{cases,posts,blocks,site-settings,preview}.ts` | 1 |
| Contact → lead | `src/app/api/contact/route.ts:58` | 1 |
| Revalidate and scheduled publish | `src/app/api/revalidate/route.ts`, `src/app/api/cron/publish-scheduled/route.ts:35,43` | 1 |
| Admin auth | `src/app/admin/login/actions.ts:26,51` | 2 |
| Admin CRUD and audit | `src/app/admin/(authed)/**`, `src/lib/cms/audit.ts:43,69`, `src/lib/admin/collections.ts` | 3–5 |
| Uploads | `src/components/admin/upload-action.ts:42,72` | 3 |
| Scripts | `scripts/{bootstrap-appwrite,backup-appwrite}.mjs`, `scripts/migrate-*.ts`, `scripts/qa-*.mjs` | Replaced by `scripts/appwrite/*` (0) and the seed (blocked, see below) |

## Environment and secrets

| Item | Status |
|---|---|
| Variable names in `.env.local` | Reused unchanged: `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `_PROJECT_ID`, `_PROJECT_NAME`, `_DATABASE_ID`, `APPWRITE_API_KEY`, `APPWRITE_WEBHOOK_SECRET` |
| Validation | `packages/cms/src/env.ts` (zod): `https` and `/v1` endpoint, ID format, key presence. Errors name the variable, never its value |
| API key exposure | Server-only (no `NEXT_PUBLIC_`). `readServerEnv` refuses to run in a browser. No key text appears in `.next/static` after the build |
| `.env.example` | Had no Appwrite section; one is added with placeholders only |
| Key leaked in git history (`6b16f90:.env.example`, pushed to `origin/backend-cms`) | **Revoked** (returns HTTP 401) |
| Key stored as plain text in `.claude/settings.local.json` (an old curl allow-rule; the file is gitignored) | **Revoked** (returns HTTP 401). Delete those allow-rules anyway |

## Live-project risks: resolved on 2026-10-27 (production, approved by the user)

| Severity | Finding | Fix applied |
|---|---|---|
| High | `lead` had `create("any")` | Removed. `lead` is now `read`/`update`/`delete` for `team:admin` only. The site writes enquiries with the server key. Anonymous POST returns 401 |
| High | `lead` was readable and updatable by editors | Admin-only, as above |
| Medium | `lead.ipAddress` held raw IPs | Both rows backfilled with `ipHash` (HMAC-SHA256 keyed with `IP_HASH_SALT`), then the column was **dropped** |
| Medium | Bucket accepted `svg` | `svg` removed; encryption turned **on**; create and update now include `team:admin` |
| Medium | Every content table had `read("any")` | Removed (plan D5: public pages read server-side with the key). Anonymous reads return 401 |
| Medium | `auditLog` was writable by writer, editor and admin teams, and deletable | Now append-only through the server key; read by `team:admin` only |
| Low | 102 columns still use the deprecated `string` type | Kept as they are. All 61 new columns are `varchar`, `text`, `mediumtext`, `enum`, `integer` or `boolean` |

## Migration history

| Date | Step | Script | Result |
|---|---|---|---|
| 2026-10-27 | Backup of all rows and the schema | `npm run appwrite:backup` → `backups/appwrite-2026-10-27T07-52-36-970Z/` (gitignored; **holds the 2 raw IPs**; delete once you're satisfied) | 11 tables, 27 rows |
| 2026-10-27 | Evolve schema in place (additive) and set permissions | `npm run appwrite:schema -- --apply` | 91 changes: 5 new tables, 61 new columns, 13 indexes, 11 permission sets, bucket. Re-run: 0 pending |
| 2026-10-27 | Hash enquiry IPs, drop `lead.ipAddress` | `npm run appwrite:migrate:lead-ip -- --apply` | 2 rows hashed; column dropped |
| 2026-10-27 | Seed from `src/data/*.ts` (now `scripts/appwrite/fixtures/`) | `npm run appwrite:seed -- --apply` | Existing rows updated in place (IDs kept); 49 rows created. Re-run: 0 changes |
| 2026-10-27 | Add `lead.messageBody` (text) | `npm run appwrite:schema -- --apply` | 1 column. Form allows 5,000 chars; legacy `message` (string 4,000, required) keeps the first 4,000 until it is contracted (needs your confirmation) |
| 2026-10-27 | Deploy Function `revalidate-site` (node-22, events on 12 content tables, no execute permission) | `npm run appwrite:function -- --apply` | Deployment ready; a row event produced a signed POST to the site |

New tables:
- `caseApproachStep`, `caseScreen`, `caseMetric`: children of `caseStudy`;
- `capabilityGroup`;
- `stackItem`.

Child rows hold their parent's ID in a plain column rather than a relationship column, so that `(parentId, orderIndex)` can be one index. The admin's delete action removes children together with the parent (plan D14).

Kept for now, to remove once Phase 1 switches readers over:
- `caseStudy.approachJson`, `screensJson` and `metricsJson`;
- `caseStudy.coverFileId` (cleared, because it pointed to files that no longer exist);
- the old hero, logo and OG columns on `siteSettings`;
- the empty `navItem` and `teamMember` tables;
- the empty `writer` and `viewer` teams.

The 6 placeholder `clientLogo` rows (Lattice, Vercel…) are kept with `approved = false`, so the site still shows none.

## Script notes

The scripts set request timeouts and retry automatically (`scripts/appwrite/retry.mts`):
- `--dns-result-order=ipv4first`: on this network, Appwrite's IPv6 address is unreachable.
- A call that never connected is retried.
- A read that stalled is retried.
- A write that stalled is not retried. Re-run the idempotent script instead.
