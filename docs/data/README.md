# Data architecture — Codeminds CMS

Appwrite Cloud (server 2.x, TablesDB), one project, one database `cmd_website_db` (production only; the plan allows a single database). Everything editable on codeminds.digital lives here; the admin app at admin.codeminds.digital edits it.

```
Visitors ──► Site (Next.js, pre-rendered, tag-cached)
               │ server-only key: rows.read + rows.write (enquiries)
               ▼
           Appwrite ── row event ──► Function revalidate-site ──HMAC──► Site /api/revalidate
               ▲                     Function retention-enquiries (daily): deletes enquiries > 24 months
               │ staff member's own session (Appwrite permissions apply)
Staff ──► Admin app ── key only for: sign-in, staff management, audit log
               └── Preview → Site /api/preview (signed, 10 min) → draft mode
```

## How content flows

1. Staff edit in the admin; every save is a **draft** in `contentDraft` (one per project, post, or home-page section). Live tables are untouched.
2. Editors submit for review. Admins publish: the draft is validated again and written to the live tables **in one transaction, as the Admin's own session** — Appwrite refuses an Editor (live tables are Admin-write-only).
3. The row change fires `revalidate-site`; the site expires that content's cache tag and the next visit renders fresh (hourly safety net).
4. Preview shows drafts to one browser for 10 minutes (signed link → draft mode + signed preview cookie); visitors never see drafts.

## Reference

| Document | What |
|---|---|
| [schema.md](schema.md) | Every table and column (generated) |
| [permissions.md](permissions.md) | Who can do what, per table and bucket (generated) |
| [indexes.md](indexes.md) | Every index and the query that uses it; unused ones flagged (generated) |
| [runbooks.md](runbooks.md) | Deploy, keys, backup/restore, incidents, schema changes |
| [security-review-2026-10-27.md](security-review-2026-10-27.md) | Independent review: findings, fixes, accepted risks |
| [appwrite-compat-audit.md](appwrite-compat-audit.md) | Phase 0 audit and the production migration history |
| [../superpowers/plans/2026-10-27-appwrite-cms-backend.md](../superpowers/plans/2026-10-27-appwrite-cms-backend.md) | Plan, decisions D1–D26, progress |

Regenerate the generated files after any schema change: `npm run appwrite:pull && npm run appwrite:docs`.

## Critical rules

- Public pages read server-side only; no table grants access to `any`. Storage `public-assets` is public-read by design (published images); uploads are images only (no SVG), ≤ 10 MB, encrypted, antivirus-scanned.
- Enquiries (`lead`) are Admin-only, store a keyed hash of the IP (never the raw IP), and are deleted 24 months after their last update.
- The audit log is append-only for people (server key creates; Admins read; no person can edit or delete — server keys with `rows.write` technically could, see the security review) and never holds personal data.
- Article bodies pass an allow-list on save **and** on render (no HTML, scripts, styles or foreign images).
- Schema lives in `scripts/appwrite/schema.mts` (additive, idempotent, dry-run by default). No Console-only changes.
