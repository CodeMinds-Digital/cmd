# Appwrite backend + custom admin — plan

**Status:** approved 2026-10-27. **All phases (0–6) done in code** (2026-10-27). Remaining: your deploys + Console settings (checklists below) and the confirmed clean-up of legacy data (runbooks.md → Pending clean-up)
**Date:** 2026-10-27
**Decided by the user:** Appwrite + custom admin (option C); editable content = projects, blog, contact enquiries inbox, site content; team with roles (Admin / Editor); Appwrite Cloud; admin as a **separate app**; visual (Tiptap) blog editor; enquiries Admin-only, deleted 24 months after last update.

## Goal

Move every piece of editable content out of `src/data/*.ts` into Appwrite, and give the team a separate admin app (`admin.codeminds.digital`) to manage it — without making the public site slower (Lighthouse 100 / LCP ≤ 1.5 s budgets stay).

## What exists today (inspected 2026-10-27)

| Area | Today | Notes |
|---|---|---|
| Projects | `src/data/cases.ts` — 6 cases, nested arrays (approach steps, screens, metrics) + embedded testimonial | Pages `/work`, `/work/[slug]` are SSG via `generateStaticParams` |
| Blog | `src/data/posts.ts` — 5 posts, **no real article bodies** (one-line `body` placeholders) | `/journal`, `/journal/[slug]` SSG |
| Site content | `capabilities.ts`, `process.ts`, `stack.ts` (+ brand-icon keys), `logos.ts` (empty), `site.ts` (contact, booking, delivery weeks, nav) | ~20 components import from `src/data` |
| Enquiries | Contact server action + `/api/contact` → email only (nodemailer); in-memory rate limit, honeypot, zod schema | Nothing is stored |
| Appwrite | **Corrected 2026-10-27:** none on this branch, but a live project exists (from the `backend-cms` branch): database `cmd_website_db` (legacy), 11 tables with content + 2 enquiries, bucket `public-assets`, teams admin/editor/writer/viewer (0 members), 0 users | See `docs/data/appwrite-compat-audit.md`; reconcile, don't duplicate (D12) |
| Hosting | Dokploy (Docker, `output: standalone`), single replica | |
| Versions | Next 16.2.4, React 19.2; live server **2.6.2**; `node-appwrite` 31.0.0 (targets 2.5.x) | `npm run appwrite:check` guards SDK ≥ server mismatch |

## Architecture

```
Visitors ──► Site (codeminds.digital, Next.js) — pre-rendered, tag-cached
                 │  server-only read key (rows.read, files.read)
                 ▼
            Appwrite Cloud ──(row events)──► Function `revalidate-site`
            TablesDB · Storage · Auth/Teams        │ HMAC-signed POST
                 ▲                                  ▼
                 │ staff member's own session   Site /api/revalidate → revalidateTag(...)
Staff ──► Admin app (admin.codeminds.digital, Next.js, noindex)
                 └── "Preview draft" → Site /api/preview (signed, short-lived) → draftMode
Contact form ──► Site server action ──► email (as today) + `enquiries` row (write key)
```

- **Public reads are server-side only.** No Appwrite calls from visitors' browsers, so no table needs `Role.any()`; drafts can never leak.
- **Caching:** each repository read is cached with a tag (`projects`, `project:<slug>`, `posts`, `site`…). Any row change (from the admin **or** the Appwrite Console) fires the `revalidate-site` Function, which calls the site's `/api/revalidate` with an HMAC signature → matching tags revalidate; the public page updates within seconds, still served static.
- **Draft preview:** the admin links to the site's `/api/preview` with a signed, 10-minute token; the site enables Next draft mode for that browser only and reads `draft`/`in_review` rows.
- **Admin auth:** Appwrite email + password sessions (+ TOTP MFA for admins), SSR pattern (session secret in an httpOnly, Secure, SameSite=Lax cookie on the admin domain, `node-appwrite` session client). Admin writes run **as the signed-in user**, so Appwrite permissions — not just UI checks — enforce Admin vs Editor.
- **Shared code:** schema, generated types, zod validators and the rich-text renderer live in one shared package used by both apps (`packages/cms`, npm workspaces — D11).

## Roles

One Appwrite **Team** `staff` with membership roles `admin` and `editor`.

| Capability | Editor | Admin |
|---|---|---|
| Create / edit drafts (projects, posts, site content) | ✓ | ✓ |
| Submit for review | ✓ | ✓ |
| Publish / unpublish / archive | — | ✓ |
| Delete content, media | — | ✓ |
| Upload media | ✓ | ✓ |
| Enquiries inbox | — | ✓ |
| Invite / remove staff, change roles | — | ✓ |
| View audit log | — | ✓ |

Publishing rules are enforced server-side (server action checks role **and** table permissions back it up: `update` on `state=published` rows is admin-only via the publish action).

## Data model (database `site`, TablesDB)

Conventions: every content table has `state` enum `draft | in_review | published | archived`, `publishedAt` datetime, `position` integer (manual order), `createdBy` / `updatedBy` (user IDs). Row security **off** (table-level permissions are enough: staff-only). Custom deterministic IDs where seeding must be idempotent (slug-derived).

| Table | Key columns | Relationships | Indexes (→ query) |
|---|---|---|---|
| `projects` | slug (unique), title, client, year, brief, tags[], status `live\|coming`, eta, coverFileId, coverAlt, role, duration, liveUrl, problem (text) | 1→many `project_steps`, `project_screens`, `project_metrics` (cascade delete); many→1 `testimonials` (set null) | unique(slug); key(state, position) → public list |
| `project_steps` | position, title, body | → projects | key(project, position) |
| `project_screens` | position, fileId?, alt, caption, tone `paper\|ink\|mixed` | → projects | key(project, position) |
| `project_metrics` | position, label, value | → projects | key(project, position) |
| `posts` | slug (unique), title, excerpt, body (rich-text doc, see Q3), coverFileId, tags[], readingMinutes (computed on save), seoTitle, seoDescription, authorName | — | unique(slug); key(state, publishedAt desc) → journal list; fulltext(title) → admin search |
| `testimonials` | quote, author, role, company, approved | ← projects | key(approved, position) |
| `client_logos` | name, fileId, width, approved | — | key(approved, position) |
| `capabilities` | index, title, description, tags[], services[], proof, tone, spanMd, spanLg | 1→many `capability_groups` | key(state, position) |
| `capability_groups` | position, title, items[] | → capabilities | key(capability, position) |
| `process_steps` | index, title, body, duration, deliverables[] | — | key(position) |
| `stack_items` | label, category enum, icon (brand-icon key, validated against the sprite) | — | key(category, position) |
| `site_settings` | single row id `site`: email, calUrl, city, country, timezoneLabel, replyWithin, booking status, deliveryMinWeeks, deliveryMaxWeeks, disciplines[] | — | — |
| `enquiries` | name, email, project, budget, timeline, message, status `new\|replied\|won\|lost\|spam`, notes, assignedTo, source `form\|api`, ipHash (salted SHA-256, never raw IP), emailDelivered bool | — | key(status, $createdAt desc) → inbox; key($createdAt) → retention job |
| `audit_log` | actorId, actorName, action, tableId, rowId, summary | — | key($createdAt desc); key(tableId, rowId) |

Navigation (`site.nav`) and component layout props stay in code — they are structure, not content.

### Permissions (table level)

| Table | create | read | update | delete |
|---|---|---|---|---|
| content tables | team:staff | team:staff | team:staff (publish transition admin-only, enforced in the action) | team:staff/admin |
| `site_settings` | — (seeded) | team:staff | team:staff/admin | — |
| `enquiries` | server key only | team:staff/admin | team:staff/admin | team:staff/admin |
| `audit_log` | server key only | team:staff/admin | nobody | nobody |

Public pages read with a **read-only** server API key (`rows.read`, `files.read`). The contact form writes with a separate **write** key used by that one action. Appwrite key scopes are per resource type, not per table, so that key could technically write other tables — it stays server-only, is never logged, and is rotated on any suspicion. (Hardening option: move the enquiry write into an Appwrite Function holding the key; adds ~100–300 ms to form submit. Not planned unless you want it.)

### Storage

Bucket `media`: images only (JPG, PNG, WebP, AVIF; **no SVG uploads** — SVG can carry scripts), max 10 MB, antivirus + encryption on. Create: team:staff; read: `any` (published images are displayed publicly — justified); delete: team:staff/admin. Public pages serve them through `next/image` (AVIF/WebP, sized), with the Appwrite endpoint in `images.remotePatterns`.

### Lifecycle & retention

- Content: `draft → in_review → published → archived`; unpublish returns to `draft`. Archived rows are hidden from the site and kept.
- Enquiries: personal data — deleted 24 months after last update by a scheduled (daily) Appwrite Function; each deletion logged in `audit_log` (without the personal data).
- Audit log: append-only, kept 24 months.
- Backups: Appwrite Cloud database backups on the production plan (confirm plan/retention on the current pricing page), plus a weekly export of content tables to the repo-independent storage of your choice. Restore drill before go-live.

## Phases (risk-first; each ends green)

| # | Phase | Size | Verification |
|---|---|---|---|
| 0 | Appwrite Cloud projects (dev + prod), schema as code (`appwrite.config.json` via CLI, generated types), API keys; npm workspaces + `admin/` scaffold + shared `packages/cms` (schema, types, zod validators, repositories, rich-text renderer); idempotent seed from today's `src/data/*.ts` | M | Seed twice → identical row counts; types compile in both apps; site build unchanged |
| 1 | Site reads from Appwrite (projects → posts → site content) with cache tags; `/api/revalidate` (HMAC) + `revalidate-site` Function; `/api/preview` draft mode; contact form also stores the enquiry; delete migrated `src/data` content files | M | Screenshot baseline diff = 0 vs today; axe 0; Lighthouse budgets; editing a row in the Appwrite Console updates the page in ≤ 10 s |
| 2 | Admin app shell (Next.js 16, Voltage tokens, noindex): login, admin MFA, SSR session, route guard, staff/team management, audit-log writer; Dokploy service + `admin.` subdomain + TLS | M | E2E: signed-out → login; editor blocked from admin-only routes; session expiry; security headers |
| 3 | Projects editor (vertical slice): list, create/edit, ordered child lists, media upload, preview draft, submit for review, publish | M | E2E: edit → preview shows draft → publish → public page updated ≤ 10 s; editor's publish rejected by Appwrite |
| 4 | Blog editor: Tiptap (headings, lists, links, images, code, quotes), cover, SEO fields, reading time; server-side renderer with an allow-list | M | E2E create → publish → journal + OG image; XSS payloads in content render inert |
| 5 | Site-content editors (capabilities, process, stack, testimonials, logos, settings) + enquiries inbox (status, notes, assign, CSV export) + retention Function | M | E2E per editor; inbox Admin-only; retention dry-run |
| 6 | Hardening: security review (authz, CSRF, upload validation, key scopes), backup/restore drill, `docs/data/` (schema, permission matrix, index catalogue, runbooks) | S | Review clean; restore drill passes; Lighthouse unchanged |

Checkpoint with you after phases 1, 3 and 5.

## Always / Never

- **Always:** server-only keys; permissions designed with the schema; schema changes via config in git; seed scripts idempotent; every admin write audited; public pages stay pre-rendered.
- **Never:** Appwrite calls from public visitors' browsers; `Role.any()` on tables; raw IPs stored; production data copied to dev; destructive migrations or prod reseeds without explicit confirmation.
- **Out of scope:** comments/likes on posts, newsletter, multi-language content, client portal, payments.

## Decision log

| # | Decision | Choice | Why |
|---|---|---|---|
| D1 | Backend | Appwrite + custom admin | User choice (showcases the studio's own stack) |
| D2 | Content scope | Projects, blog, enquiries, site content | User choice |
| D3 | Editors | Team with Admin / Editor roles | User choice |
| D4 | API style | TablesDB (tables/rows/columns) | Current server 2.5 / SDK 31 |
| D5 | Public data access | Server-side only, read-only key, tag-cached | No public table permissions; speed unchanged |
| D6 | Hosting | Appwrite Cloud | User choice: managed, current server version, backups handled |
| D7 | Admin location | Separate app at `admin.codeminds.digital` | User choice: isolation from the public site |
| D8 | Revalidation | Appwrite Function on row events → HMAC-signed `/api/revalidate` | Needed with a separate admin; also covers Console edits |
| D9 | Blog editor | Tiptap visual editor, structured JSON, server-rendered with an allow-list | User choice: non-technical editors |
| D10 | Enquiries | Admin-only; auto-delete 24 months after last update | User choice: least access to personal data |
| D11 | Repo layout | Same repo: site stays at the root; `admin/` (own Next.js app, own Dockerfile/Dokploy service) + `packages/cms` (shared) via npm workspaces | User choice: no disruption to the live site's build |
| D12 | Live schema vs this plan's 14 tables | **Evolve `cmd_website_db` in place** (user, 2026-10-27): keep live table IDs and the `admin`/`editor` teams (no `staff` team). Plan names map to: projects→`caseStudy` (+`caseApproachStep`/`caseScreen`/`caseMetric`), posts→`journalPost`, testimonials→`testimonial`, client_logos→`clientLogo`, capabilities→`capability` (+`capabilityGroup`), process_steps→`processStep`, stack_items→`stackItem`, site_settings→`siteSettings`, enquiries→`lead`, audit_log→`auditLog`; `position`→`orderIndex` | Live project already holds content; extend, don't duplicate |
| D15 | Site caching | `unstable_cache` + tags (Next 16 "previous model"), not Cache Components / `'use cache'` | `cacheComponents` changes rendering site-wide; this keeps pages byte-identical and fully static. Revisit if the site adopts Cache Components |
| D16 | Revalidation mode | `revalidateTag(tag, { expire: 0 })` (next visit renders fresh) + 1 h safety-net `revalidate` | Editors see their change on the next load; SWR (`'max'`) would show one stale view first |
| D17 | Enquiry storage | Stored **before** emailing; form succeeds if either the row or the email worked; `emailDelivered` recorded after the response (`after()`) | An SMTP outage can no longer lose an enquiry |
| D18 | Build-time content | Docker build reads Appwrite: public IDs as Dokploy *Build Time Arguments*, API key as a *Build-time Secret* (BuildKit mount, not in image) | Pages are prerendered from Appwrite |
| D19 | Admin roles | Live teams `admin` / `editor` (D12), not one `staff` team with membership roles; highest wins; other teams = no access | Evolve in place |
| D20 | Admin sign-in | Appwrite SSR: session created with the key (only way to get the secret), then every request as the user. Cookie `__Host-cmd_admin`, httpOnly, Secure, SameSite=Strict, ≤ 12 h. Key-based sign-in skips Appwrite's abuse limits → app-level limits (per email 5/3 min, per IP 20 + 2/min, two-factor 5/min per session) | Security |
| D21 | Two-factor | TOTP required for Admins (gate confines them to /account until enrolled); optional for Editors; recovery codes shown once | Plan "admin MFA" |
| D22 | Staff invites | Admin-only action with the server key: create account (no password) → team membership → Appwrite recovery email ("set your password", 1 h). Removing/demoting signs the person out everywhere; nobody edits themselves; ≥ 1 Admin always | Works without Appwrite's client invite flow (which can't hand the session to an SSR app); every step audited |
| D23 | Admin hardening | Per-request nonce CSP (`strict-dynamic`, `frame-ancestors 'none'`, `object-src 'none'`), DENY framing, no-referrer, no-store, `X-Robots-Tag: noindex`, HSTS on HTTPS, robots disallow, all pages dynamic | Defence in depth |
| D24 | Draft layer | Editors write only `contentDraft` (one JSON document per item, unique tableId+rowId, optimistic-concurrency on save); live project tables (caseStudy, caseApproachStep, caseScreen, caseMetric, testimonial) are **Admin-write-only**; publish = one TablesDB transaction run as the Admin's own session. Draft preview overlays drafts on live data | The plan's "editor's publish rejected by Appwrite" is impossible if editors can update live rows; also stops edits to published content going live without review. Journal (Phase 4) and site content (Phase 5) move behind the same layer |
| D25 | Home-page sections | One draft per whole section (capabilities, process, stack, client logos, studio details; contentDraft rowId `all`), published as one transaction that keeps existing row IDs and deletes removed rows; these tables + capabilityGroup are Admin-write-only, siteSettings Admin-update-only. Testimonials have no standalone editor (edited inside projects) | They render as whole lists; reordering and add/remove are natural on the list, and one review covers the section |
| D26 | Enquiry retention schedule | Daily **interval** (1,440 min), not cron — Appwrite Cloud's current plan rejects cron schedules (`billing_feature_unsupported`); Appwrite picks the time of day | Same daily cadence on the current plan |
| D27 | Preview session | Draft preview needs Next draft mode **and** a signed `cmd_preview` cookie valid 10 minutes; preview = published content + saved drafts (hidden/archived rows never shown) | Security review #4: draft-mode cookie alone is site-wide and never expires |
| D28 | Restore drills | Restore into no-access `zz_drill_`-prefixed tables in the live database, verify every row, delete (plan allows one database); real disaster recovery restores into a fresh project with the same script | Drill must not touch live tables; no second database available |
| D14 | Child rows | Plain parent-ID column + `(parentId, orderIndex)` index, not relationship columns; cascade delete in the admin delete action | One composite index per list query; no relationship-loading cost |
| D13 | Environments | Production project only (user: "PROD … only"); no dev project. Every production change: backup → dry run → `--apply` → re-run shows 0 changes | User instruction |

## Progress

| Phase | Status |
|---|---|
| 0 | **Done 2026-10-27.** Audit (`docs/data/appwrite-compat-audit.md`); `packages/cms` (env validation, TablesDB admin client, SSR session helpers incl. sign-in secret fix, asset URLs, IP hashing, generated types) via npm workspaces; production evolved in place (5 new tables, 61 columns, 13 indexes), permissions tightened (no public table access; enquiries Admin-only; audit append-only), raw IPs hashed and column dropped, bucket SVG off + encryption on; seeded from `src/data` (idempotent, re-run = 0 changes). Scripts: `appwrite:{check,pull,backup,schema,seed,migrate:lead-ip}`. Checks: tsc 0, eslint 0, unit 52/52, `next build` OK, `appwrite:check` 0 failures, anonymous read/write → 401. Deviations: `admin/` scaffold moved to Phase 2; Docker build not verified locally (no Docker). **Deploy note:** add `IP_HASH_SALT` to Dokploy env before Phase 1 ships |
| 1 | **Done in code 2026-10-27, not yet deployed.** Site reads all content from Appwrite through `src/lib/cms/repository.ts` (tagged `unstable_cache`, draft-aware); `src/data/*` moved to `scripts/appwrite/fixtures/` (seed only; `src/config/site.ts` keeps name/version/nav); `/api/revalidate` (HMAC, 5-min replay window) + `revalidate-site` Function deployed (12 content tables; verified: event → signed POST); `/api/preview` + `/api/preview/exit` (signed 10-min links, draft banner); contact form + `/api/contact` store enquiries (`lead`, `messageBody` added for 5,000-char messages, IP hashed). Checks: screenshots 7 routes × 4 widths × 2 motion modes = 56 → 48 identical, 8 differ only by the live clock / marquee phase; axe 0 new (1 pre-existing heading-order on "coming" case page); Lighthouse perf/a11y 1.0, LCP ≤ 1.36 s; unit 60/60; standalone server renders from Appwrite after revalidate; edit → revalidate → fresh page ≤ 4 s locally. **To go live:** Dokploy env + build args/secret (below), then deploy |
| 2 | **Done in code 2026-10-27, not yet deployed.** `admin/` Next.js 16 app (npm workspace, own Dockerfile, Voltage colours shared via `packages/cms/styles/voltage-colors.css`): sign-in, two-factor sign-in (TOTP / recovery code), forgot/reset password, Admin two-factor enrolment (QR via Appwrite Avatars), password change, role guard on every page and action, staff management (invite / change role / remove), audit-log writer (`packages/cms/src/audit.ts`) + Admin audit view, sign-out that ends the Appwrite session. Shared modules moved to `packages/cms`: rate limiter, client IP. Checks: admin E2E 11/11 ×3 runs against a local Appwrite mock (signed-out redirects, headers/CSP + hydration under CSP, generic login errors, editor blocked from admin pages, cookie flags, revoked session → sign-in, non-staff → no access, Admin forced to enrol, enrolment, two-factor sign-in, invite/remove, audit trail, sign-out, rate limit, phone width, axe 0 on login + staff); unit 63/63; site screenshots unchanged (clock/marquee only); admin standalone server smoke-tested; `npm ci` with workspace manifests OK. Bugs found by the tests and fixed: `__Host-` cookie wasn't cleared on sign-out; removed-person message vanished with the row; screen-reader label caused sideways scroll on phones; robots.txt sat behind the login. **Not verified:** real Appwrite sign-in (no test accounts may be created in production) and Docker builds (no Docker here) |
| 3 | **Done in code 2026-10-27, not yet deployed.** Draft layer (D24): `contentDraft` table + Admin-only live project tables (applied to production after a backup; 17 changes, re-run 0). `packages/cms/src/content/project.ts`: one zod schema for a project, live↔document mapping, transactional `publishProject` — verified on real Appwrite with a throwaway project (publish, round trip, republish removes stale children, slug clash rejected, mid-transaction failure rolls back, cleaned up). Admin: Projects list (live / hidden / not published, draft / in review badges, Admin reorder), editor (basics, cover upload, details, approach / screens / results lists with reorder, client quote, per-field errors with focus, unsaved-changes guard, stale-tab conflict refusal), Preview (signed 10-min link), Submit for review, Publish / Hide / Show again / Delete (Admin), image upload route (same-origin, staff, image content sniffing — no SVG, ≤ 10 MB). Site: draft preview overlays drafts (verified on real Appwrite against the local site: preview shows the draft on the case page and /work, public shows live), uploaded images via Appwrite URLs (`images.remotePatterns`). Checks: admin E2E 18/18 ×3 (mock mirrors the permission split); unit 69/69; site screenshots unchanged (clock/marquee only). Bugs found and fixed: protocol-relative `//host` accepted as a site image path; hydration-unsafe random IDs on upload fields; repeated "Title" labels indistinguishable to screen readers; signed-out API POST redirected into a bogus form action (now 401). **Not verified:** a real Editor account being refused by Appwrite (no real test accounts may be created; the permission config is verified and the mock enforces the same split); edit → live page ≤ 10 s on production (needs the Phase 1 deploy) |
| 4 | **Done in code 2026-10-27, not yet deployed.** `packages/cms/src/content/rich-text.ts`: allow-list schema for article JSON (H2–H4, paragraphs, lists, quotes, code, rules, hard breaks; bold/italic/underline/strike/code/link marks; links https/http/mailto/site-path only; images = Appwrite file ID + required alt; unknown nodes reject, unknown attributes stripped; size/depth limits), plain-text + reading time. `content/post.ts`: post document, live mapping (legacy plain bodies → paragraphs), `publishPost`. journalPost made Admin-write-only (production, 1 change). Site: `src/lib/cms/rich-text.ts` renders validated JSON with React elements only (no HTML strings), external links `rel="noopener noreferrer nofollow ugc"`; post cover via next/image; SEO title/description; drafts overlaid in preview (generic `withDrafts`). Admin: Journal list + editor (Tiptap 3.32, `injectCSS: false` for the CSP, foreign pasted images ignored, link guard, image insert with required alt) on a shared draft-form hook / action bar / danger zone (projects refactored onto it). Checks: XSS unit tests (11 payload classes inert, tag allow-list, attribute stripping, limits); admin E2E 23/23 ×6 after fixing a flake (incl. hostile paste, Editor write refused); real Appwrite: publish round trip, preview of a draft-only post, tampered draft not rendered (404), script text escaped, OG image 200, legacy post unchanged; unit 86/86; site screenshots unchanged; no editor code in the site bundle. Bug found by a flaky run and fixed: focus on the first invalid field after a failed save could silently not happen (moved from requestAnimationFrame to a post-commit effect) |
| 5 | **Done in code 2026-10-27, not yet deployed.** Sections (D25): `packages/cms/src/content/sections.ts` (schemas matching live columns, live→document, transactional publish), brand-icon keys moved to `packages/cms/src/brand-icons.ts`; six tables Admin-write-only (production, after a backup; re-run 0). Real Appwrite: every section round-trips identically through publish; stack add/remove works; site screenshots identical afterwards. Site preview overlays section drafts (verified on real Appwrite: preview home shows drafts, public doesn't). Admin: Site content overview + one editor for all five sections (lists with reorder, groups, icon picker, settings with min ≤ max and https checks). Enquiries inbox (Admin only, as the Admin's session): status filter with counts, detail with full message, status / assignee / notes, delete, CSV export (formula-injection escaped, audited); audit entries carry no personal data. Retention Function `retention-enquiries` deployed (daily interval, D26; execution key rows.read/write; no execute permission): dry run (24 months) = 0 candidates, dry run (0 days) = 2 candidates, nothing deleted. Checks: admin E2E 29/29 ×6; unit 90/90; site screenshots unchanged; Lighthouse perf/a11y 1.0, LCP ≤ 1.38 s |
| 6 | **Done in code 2026-10-27.** Independent security review (separate reviewer, code only) → 10 findings, all fixed or documented with tests (`docs/data/security-review-2026-10-27.md`): invite pre-hijack, TAB open redirect (reproduced), publishing an unreviewed version, open-ended preview, sessions on password change, last-Admin race, uncapped request bodies, public-site security headers, audit display names, nested env files in Docker context. Least-privilege keys defined + `npm run appwrite:check-key` probe (harmless calls). Backups now include Storage files; `npm run appwrite:restore` (never overwrites; refuses live tables without a prefix) — **drill passed**: 6 tables / 46 rows restored into no-access copies, every row verified, deleted. `docs/data/`: README (architecture), generated schema / permission matrix / index catalogue (8 unused indexes flagged), runbooks (keys, staff, backup, restore, schema changes, incidents, pending clean-up). Admin mobile menu. Checks: admin E2E 33/33 ×3; unit 93/93; site pages still static; site screenshots unchanged; Lighthouse 1.0 in all four categories; `appwrite:check` 0 failures; schema 0 pending. Bug found while testing a fix: duplicate IDs left the Account page's "New password" field unlabelled (fixed) |

## Prerequisites from the user (before Phase 0)

- Create the Appwrite Cloud account/organisation and two projects (`codeminds-dev`, `codeminds-prod`) in the nearest region; share the project IDs and endpoint.
- Run `appwrite login` locally (credentials stay with you).
- Create the API keys listed under Permissions in the Console and put them in `.env.local` / Dokploy env vars yourself — keys are never pasted into chat.
- DNS: `admin.codeminds.digital` → Dokploy server.

## Deploy checklist for Phase 1 (Dokploy)

- **Runtime environment:** `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `NEXT_PUBLIC_APPWRITE_DATABASE_ID`, `APPWRITE_API_KEY`, `APPWRITE_WEBHOOK_SECRET`, `PREVIEW_SECRET`, `IP_HASH_SALT` (values in `.env.local`).
- **Build Time Arguments:** `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `NEXT_PUBLIC_APPWRITE_DATABASE_ID`.
- **Build-time Secrets:** `APPWRITE_API_KEY`.
- After deploy: edit any content row in the Appwrite Console → the page updates on next load; the `revalidate-site` execution log shows `→ 200` (currently `→ 404` because the route isn't live yet).

## Deploy checklist for Phase 2 (admin)

1. **Appwrite Console** (you): Auth → add a **Web platform** for `admin.codeminds.digital` (and `localhost` for dev) so password links are accepted; optionally set session length to 12 h and turn on password dictionary + personal-data checks.
2. **API key** used by the admin needs: `sessions.write`, `users.read`, `users.write`, `teams.read`, `teams.write`, `rows.read`, `rows.write`, `tables.read`. (A separate admin key is better than sharing the site's; Phase 6 narrows both.)
3. **Dokploy:** new application from this repo, Dockerfile `admin/Dockerfile`, build context = repo root. Runtime env: `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `NEXT_PUBLIC_APPWRITE_DATABASE_ID`, `APPWRITE_API_KEY`, `ADMIN_URL=https://admin.codeminds.digital`. No build args/secrets needed.
4. **DNS + TLS:** `admin.codeminds.digital` → Dokploy server; enable HTTPS in Dokploy (required: the session cookie is `__Host-`/Secure).
5. **First Admin** (you): `ADMIN_URL=https://admin.codeminds.digital npm run appwrite:create-admin -- --email you@… --name "…" --apply` → set a password from the email → sign in → set up two-factor. Then invite the team from **Staff**.

## Deploy checklist for Phase 3

- **Admin env** (in addition to Phase 2): `SITE_URL=https://codeminds.digital`, `PREVIEW_SECRET` (same value as the site's).
- **Site:** redeploy so `images.remotePatterns` includes the Appwrite host (it's read from `NEXT_PUBLIC_APPWRITE_ENDPOINT` at build — already a build argument).
- **Check after deploy:** as an Editor, edit a project → Preview shows the change → Submit; as an Admin, Publish → /work/<slug> shows it on next load; the `revalidate-site` log shows `→ 200`.

## Deploy checklist for Phase 4

- Nothing new beyond Phases 1–3 (same env). After deploy: as an Editor write a post with a heading, list, link and image → Preview → Submit; as an Admin Publish → /journal lists it and /journal/<slug> renders it.

## Deploy checklist for Phase 5

- Nothing new in env. The retention Function is already live in Appwrite (runs daily). After the site deploy: as an Editor change a capability → Preview home → Submit; as an Admin Publish → home updates; open Enquiries, update one, export CSV.

## Deploy checklist for Phase 6 (you)

1. **Keys:** in the Appwrite Console create a *site* key (`rows.read`, `rows.write`) and an *admin* key (`sessions.write`, `users.read`, `users.write`, `teams.read`, `teams.write`, `rows.write`); put each in its Dokploy service (site: runtime env **and** build-time secret); keep the broad key only in your `.env.local`. Verify: `npm run appwrite:check-key -- --role site --env <VAR>` and `--role admin`.
2. **Console → Auth → Security:** session length **12 hours**; enable invalidating sessions on password change; set a users limit / disable unused sign-up methods.
3. **Backups:** schedule `npm run appwrite:backup` weekly on a trusted machine; copy to encrypted storage; delete backups older than 24 months.
4. **Clean-up (optional, deletes data):** reply "approve clean-up" to remove the legacy columns/tables/teams/indexes listed in runbooks.md (backup first; expand → contract).
