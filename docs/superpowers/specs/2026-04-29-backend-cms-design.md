# Codeminds Digital — Backend Design (Appwrite)

**Date:** 2026-04-29 (revised)
**Status:** Approved (Appwrite), ready for implementation planning
**Scope:** End-to-end backend for the marketing site — manage logo, app icons, favicons, metadata, all texts, case studies, journal, team, testimonials, logo wall, site settings — plus a foundation for future application data (leads, client portal, auth)
**Estimated effort:** 8 phases (A0–A7), ~10 weeks active work, each independently shippable

---

## Decision summary

| | Choice | Why |
|---|---|---|
| Backend | **Appwrite** | One stack for marketing CMS + future application data (leads, portal, auth); self-host option; BSD-3 open source; no per-seat pricing |
| Hosting | **Appwrite Cloud** for v1 (revisit self-host at A6) | Operational simplicity now; migrate to self-host later if cost or compliance triggers it |
| Admin UI | Custom-built in `/admin` route (this is the work Sanity Studio would have given us free) | Editor UX matters more than dev console; Appwrite Console is a developer tool, not an editor |
| Rich text | **TipTap** (ProseMirror-based) with custom marks bound to design tokens | Open source, headless, TypeScript-first |
| Image pipeline | `getFilePreview` wrapped in a typed `urlForAsset()` helper | Works for AVIF/WebP/resize; we add the focal-point convention manually |

### What we accept by choosing Appwrite over Sanity

- **+5 weeks of admin-UI build work** (forms, validation, list views, image upload UX, draft/publish state machine)
- **No native real-time co-editing on docs** (Appwrite Realtime gives live updates, not Operational Transform / CRDT)
- **No native drafts/scheduled publishing** — we build it via `status` field + Appwrite Functions cron

### What we gain

- **One backend for everything**: marketing content + leads (replaces Nodemailer-only contact form) + future client portal + auth
- **Self-hostable** (Docker compose, Kubernetes) when compliance or cost triggers it
- **No per-editor seat pricing** — unlimited editors on the free tier (Appwrite Cloud) or zero cost self-hosted
- **Generic enough for future product app** — when you build a customer dashboard or gated content, the auth + DB + functions infrastructure already exists
- **Open source (BSD-3)** — no vendor lock-in

---

## Audience and editor jobs-to-be-done

**Primary editor:** non-technical agency staff (2–4 people).
**Secondary editor:** founder / lead engineer (1 person).
**Future:** end users / clients logging into a portal.

JTBD anchors:
- *"When a client signs an NDA, I want to swap their logo onto the wall without filing a ticket."*
- *"When I close a case study, I want to publish it the same day with screens + metric + quote without engineering hours."*
- *"When the editor breaks the schema, I want types to fail at the page level, not at runtime in production."*
- *(future)* *"When a lead fills the contact form, I want to see it in the admin and assign a follow-up owner."*

The *future* job is the lever — it's why we're choosing one stack over two.

---

## Architecture

```
┌────────────────────────────────────────────────┐
│  /admin   (custom Next.js admin in same app)   │  ←  agency editors
│  Auth-gated by Appwrite session                │
│  TipTap rich text · image upload · validation  │
│  Generic list/detail views per collection      │
└─────────────────────┬──────────────────────────┘
                      │ writes (web SDK)
                      ▼
┌────────────────────────────────────────────────┐
│  Appwrite Cloud  (or self-hosted later)        │
│                                                │
│  ├ Auth (email/password + GitHub OAuth)        │
│  ├ Teams (admins, editors, writers, viewers)   │
│  ├ Database (collections + documents)          │
│  ├ Storage (asset buckets, AVIF/WebP previews) │
│  ├ Functions (revalidate, schedule, audit)     │
│  └ Realtime (admin live updates)               │
└─────────────────────┬──────────────────────────┘
                      │
       ┌──────────────┴───────────────┐
       │                              │
       │ node SDK (server reads)      │ Function trigger on document update
       ▼                              ▼
┌─────────────────────┐   ┌──────────────────────┐
│  Next.js 16 App     │   │  /api/revalidate     │
│  Router (Vercel)    │   │  revalidateTag(...)  │
│  Server components  │◄──┤  HMAC-verified       │
│  fetch + cache via  │   └──────────────────────┘
│  next: { tags }     │
└─────────────────────┘
                      ▲
                      │ HTML / static assets
                      │
                      User
```

**Read path (warm):** edge cache hit, zero Appwrite calls. Site stays at current static-build speeds.
**Read path (cold):** server component fetches via `node-appwrite` (~80–150 ms typical from Vercel edge to Appwrite Cloud), tags the cache, edge holds the result.
**Write path:** editor publishes in `/admin` → Appwrite Function on `databases.*.collections.*.documents.*.update` → calls `/api/revalidate?tag=case:<slug>` → Next invalidates → next request rebuilds.

---

## Data model — Appwrite collections

Each collection is created via `appwrite.json` (version-controlled) so the schema is reproducible across dev / preview / production.

```
siteSettings (singleton — single document, slug='site')
  ├ wordmarkFileId · faviconFileId · appleTouchIconFileId
  ├ themeColor · ogTitle · ogSubtitle · ogImageFileId
  ├ contactEmail · phone · bookingUrl
  ├ socialHandles (JSON: { twitter, github, linkedin })
  └ updatedAt · updatedBy (user $id)

caseStudy
  ├ slug (unique) · title · client · year · brief · tags (string[])
  ├ status (enum: draft | published | coming) · eta
  ├ coverFileId · coverFocalX · coverFocalY  (manual focal-point convention)
  ├ role · duration · liveUrl
  ├ problem (rich text JSON — TipTap doc)
  ├ approach (JSON: array of { index, title, body })
  ├ screens (JSON: array of { fileId, focalX, focalY, alt, caption })
  ├ metrics (JSON: array of { label, value })
  ├ testimonialId (reference → testimonial)
  └ publishedAt · createdBy · updatedBy

journalPost
  ├ slug (unique) · title · excerpt · publishedAt · readingTime
  ├ status (enum: draft | published | scheduled) · scheduledFor
  ├ tags (string[]) · coverFileId
  ├ body (rich text JSON — TipTap doc with custom marks)
  ├ authorId (reference → teamMember)
  └ createdBy · updatedBy

teamMember
  ├ name · role · bio · headshotFileId
  └ socialHandles (JSON)

testimonial
  ├ quote · author · role · company
  └ photoFileId

clientLogo
  ├ name · logoFileId
  ├ ndaBound (boolean)              // hides from public render
  └ orderIndex

capability
  ├ index · title · tags (string[]) · description
  └ orderIndex

processStep
  ├ index · title · body · duration
  ├ deliverables (string[])
  ├ iconPath (SVG path d-attribute)
  └ orderIndex

navItem
  ├ label · href
  └ location (enum: header | footer-studio | footer-work | footer-contact | footer-legal)

lead         (future — for contact form)
  ├ name · email · project · message
  ├ status (enum: new | qualified | replied | won | lost)
  ├ assignedTo (user $id)
  └ source (enum: contact-form | referral | direct)
```

### Storage buckets

```
public-assets       (read: public, write: editor+)   — logos, covers, screens, headshots
draft-assets        (read: editor+, write: writer+)  — pre-publish staging
favicons-icons      (read: public, write: admin)     — PWA icons, favicons
```

### Auth + Teams

```
team:admin       full schema + settings + user management
team:editor      publish + schedule + delete
team:writer      create/edit drafts only
team:viewer      read-only audit access
```

---

## Phased implementation plan

### **Phase A0 — Foundation** *(week 1, ~6 file edits + Appwrite setup)*

Goal: Appwrite project up, schema versioned, SDK wired, auth working.

| Task | What |
|---|---|
| Create Appwrite Cloud project (`codeminds-prod` + `codeminds-dev` projects) | Two environments, mirrored schema |
| Configure Auth: email/password + GitHub OAuth | Editor login |
| Define Teams: admin · editor · writer · viewer | Role buckets |
| Define `siteSettings` + `navItem` collections in `appwrite.json` | Smallest scope to validate the architecture |
| Define `public-assets` bucket | First storage bucket |
| Install `appwrite` (web SDK) + `node-appwrite` + `@appwrite.io/console` (CLI) | One-time |
| `/lib/appwrite/client.ts` + `/lib/appwrite/server.ts` | Helpers for browser + server contexts |
| `/lib/appwrite/url-for-asset.ts` | Wraps `getFilePreview` with width/format/quality + focal-point convention |
| `/app/api/revalidate/route.ts` with HMAC verification | Triggered by Appwrite Function on writes |
| Deploy a `revalidate-on-publish` Appwrite Function | Hits the revalidate endpoint |

**Deliverable:** Appwrite project live, schema source-controlled, SDKs wired, can already write a `siteSettings` doc via Appwrite Console and see the public site update via webhook.

### **Phase A1 — Admin shell** *(week 2–3, ~15 new files)*

Goal: a custom admin app at `/admin`, auth-gated, with generic list/detail views editors can actually use. **This phase is the work Sanity Studio would have given us free.**

| Task | What |
|---|---|
| `/app/admin/layout.tsx` with auth gate (redirect to `/admin/login` if no session) | Server-side check |
| `/app/admin/login/page.tsx` with email/password + GitHub OAuth buttons | Magic-link optional |
| Sidebar with collection list (driven by config, not hardcoded) | Add a new collection → appears in sidebar without code |
| Generic list view: pagination, search, status filter, sort by `updatedAt` | Reused for every collection |
| Generic detail/edit view: form fields auto-generated from schema config | Each field type (string, text, enum, image, ref, JSON-array) has a renderer |
| `<ImageUploader>` with drag-drop, preview, focal-point click-to-set | Wraps Appwrite Storage upload + focal-point convention |
| `<RefSelect>` for collection-to-collection references | Picks a `teamMember`, `testimonial`, etc. |
| Save/discard/publish UI with optimistic updates | Toast on success/failure |
| Realtime subscription per document — "another editor is viewing this" | Soft lock UX, not hard lock |
| Appwrite Functions: audit log on every document write | Stores `audit` collection entry |

**Deliverable:** working admin UI with auth, list/detail per collection. Editors can edit `siteSettings` and `navItem` end-to-end without engineering.

### **Phase A2 — Site identity collections** *(week 4, ~6 file edits)*

Goal: every site identity asset and metadata default lives in Appwrite.

| Task | What |
|---|---|
| Wire `layout.tsx` `metadata` to read `siteSettings` at request time (cached + tagged) | OG defaults, theme color, canonical |
| `<Header>` and `<Footer>` read `navItem` collection | Editor reorders nav |
| Wordmark / favicon / app icon hot-swap | Upload via admin → live within 2s |
| `app/icon.tsx` + `app/apple-icon.tsx` route handlers | Generated from Appwrite asset bytes (or static fallback) |
| StructuredData component reads from `siteSettings` | Single source for SEO chrome |

**Deliverable:** brand identity (logo, favicon, OG, social handles, contact info) fully editable in admin.

### **Phase A3 — Content as data** *(weeks 5–6, ~14 file edits)*

Goal: existing typed data in Appwrite, marketing pages read from there.

| Task | What |
|---|---|
| Define `caseStudy`, `journalPost`, `testimonial`, `teamMember` collections | Mirror existing TS types |
| Migration script: `cases.ts` + `posts.ts` → `databases.createDocument` | One-time, idempotent |
| Asset migration: `public/work/*.svg` → `public-assets` bucket | Each becomes a `coverFileId` reference |
| Refactor `/work`, `/work/[slug]`, `/journal`, `/journal/[slug]` to fetch via `node-appwrite` | Server components, `next: { tags }` cache |
| Image rendering swaps to `urlForAsset(fileId).width(1200).format('webp')` | Pipeline matches existing `next/image` flow |
| Generate types from `appwrite.json` via custom codegen script | `src/types/appwrite.ts` replaces handwritten `CaseStub` / `Post` |
| Delete `src/data/cases.ts` and `src/data/posts.ts` | Single source of truth |

**Deliverable:** all case studies + journal posts editable in admin; the static data files retire; engineering no longer touches code to add a new case.

### **Phase A4 — Reusable content blocks** *(week 7, ~8 file edits)*

Goal: every public string and image on the home page becomes editor-managed.

| Task | What |
|---|---|
| `capability` collection + connect Capabilities section | 4 hardcoded rows → CMS |
| `processStep` collection + connect Process section | 4 steps + DrawIcon path strings → CMS |
| `clientLogo` collection with `ndaBound` filter + connect LogoWall | Editor uploads, ticks NDA to hide |
| Hero copy + Conversation copy → `siteSettings` strings (or new `heroCopy` singleton) | Hero headline, subline, CTAs editable |
| Order management UI in admin (drag-to-reorder for capabilities, process steps, logos) | `orderIndex` attribute |

**Deliverable:** zero hardcoded marketing copy left in component code.

### **Phase A5 — Editorial richness** *(weeks 8–9, ~12 new files + 6 edits)*

Goal: long-form content gets first-class WYSIWYG editing. **This phase is also work Sanity gave us free.**

| Task | What |
|---|---|
| Install **TipTap** + base extensions (paragraph, heading, bold, italic, code, link, image, list) | ProseMirror-based, headless |
| Custom marks bound to design tokens: `serif-italic`, `monospace`, `accent`, `pull-quote`, `callout`, `code-block` | Each maps 1:1 to a Plasma Indigo / Geist / Instrument Serif role |
| Inline image extension with focal-point picker | Uses the same `<ImageUploader>` from A1 |
| Rich text renderer for the public site (`/lib/render-rich-text.tsx`) | Walks TipTap JSON, emits styled HTML |
| Refactor `caseStudy.problem` and `journalPost.body` to TipTap JSON | Migration script for existing strings |
| Preview routes: `/admin/preview/work/[slug]` and `/admin/preview/journal/[slug]` | Drafts visible before publish; status-aware queries |
| Visual edit deep-link: click any field in the live site (in preview mode) → admin opens with that field focused | `data-edit-id` attributes on rendered elements |
| Schema validation: `caseStudy.title.maxLength = 60`, `metric.value` regex | Constraints prevent design-break content |

**Deliverable:** editors author case studies + journal posts in WYSIWYG. Output renders identically to the live site with brand constraints enforced at the schema level.

### **Phase A6 — Workflow & permissions** *(week 10, ~8 file edits + 3 Functions)*

Goal: multiple editors, safely.

| Task | What |
|---|---|
| Permission rules: writer can `create+update` only own drafts; editor can `update` any + transition to `published`; admin handles schema | Appwrite document-level permissions |
| `status` state machine on caseStudy/journalPost: `draft → review → published → archived` | UI affordances per state |
| Audit log surfaced in admin (read-only collection) | Appwrite Function logs every write |
| Scheduled publishing | Cron Appwrite Function checks `scheduledFor` every 5 min, flips status |
| Two-stage review on `caseStudy` | `review` status + `reviewerId`, must approve before publish |
| Slack webhook on publish events | Appwrite Function: "Marketing rebuild for Acme just went live →" |
| Self-host migration evaluation | If Appwrite Cloud cost or data residency triggers it, migrate to Docker Compose on a single VPS — schema + data exports cleanly |

**Deliverable:** founder + 2–3 agency staff edit safely with separation of duties; scheduled launches work; admin notifications land in Slack.

### **Phase A7 — Power features + future foundations** *(week 11+, opt-in)*

Goal: long-tail capabilities + lay the groundwork for the future product app.

| Item | Why |
|---|---|
| **`lead` collection + contact form integration** | `/api/contact` writes to Appwrite instead of (or alongside) Nodemailer. Admin gets a leads view with status/owner. **This is the future-product-app proof.** |
| Per-case dynamic OG | Already wired in [api/og](src/app/api/og/route.tsx); now reads case fields from Appwrite |
| PostHog event integration | Track which CTA / case / capability converts |
| Sitemap + RSS auto-gen | Single source from Appwrite collections |
| Hero copy A/B variants | Two `heroCopy` documents, PostHog feature flag picks one |
| Multi-language | New `locale` attribute on translatable docs; `/[locale]/...` routes; admin shows locale tabs |
| Backup automation | Daily `appwrite db export` to S3-compatible storage |
| Self-host option | Docker Compose on Hetzner / DigitalOcean / your own infra |

---

## Design-system integration

The Plasma Indigo + Geist + Instrument Serif system from R1 stays the source of truth. The admin and rich-text editor become the **binding layer** between editor intent and design tokens.

Three concrete moves:
1. **Custom TipTap marks** map to design tokens. The `serif-italic` mark renders as `<span class="font-serif italic text-brand-400">`. Editors pick a *brand role*, not a hex.
2. **Focal-point convention enforced at upload time.** `<ImageUploader>` requires the editor to click the focal point before save. The point persists as `coverFocalX/Y` and gets passed to `getFilePreview` as `gravity`. A wide screenshot crops cleanly to 4:3 (tile) and 16:9 (case hero) from the same hotspot.
3. **Schema-level validation.** `caseStudy.title.maxLength = 60` (fits the h1/display token). `metric.value` regex enforces numeric+unit. The admin form refuses submission until valid. These guardrails replace the design-review step.

---

## Trade-offs (explicit)

| Decision | Cost | Why accepted |
|---|---|---|
| Custom admin UI vs Sanity Studio | +5 weeks of dev work | One backend for everything (marketing + leads + future portal); no per-seat pricing |
| BaaS-style document model vs Sanity content lake | Less rich (no Portable Text out of the box, no native drafts) | We build what we need; full ownership of the editor UX |
| Appwrite Cloud vs self-hosted from day one | Vendor SaaS for v1 | Operational simplicity; migrate to self-host later when triggers fire — schema and data export cleanly |
| TipTap vs Sanity Portable Text | We maintain the schema-to-render layer | TipTap is open source, owned by us, no vendor renderer to track |
| `getFilePreview` vs Sanity's image pipeline | Manual focal-point convention; less rich than Sanity hotspots | Workable; agency editors get a click-to-set focal-point UI in `<ImageUploader>` |
| Webhook-revalidation > on-read fetch | Function can fail silently; rare seconds-long stale window | Performance gain from edge-cached SSG worth the worst-case |
| One backend for everything | Coupling marketing CMS to product backend | Strategic — when the product app comes, infra is already there |

---

## Open questions (need user input before A0 ships)

1. **Hosting:** Appwrite Cloud (recommended for v1) vs self-hosted on a VPS (Hetzner/DO/your infra)?
2. **Region:** Cloud regions are US/EU — which is closer to your editors and audience?
3. **Auth providers:** email/password + GitHub OAuth (recommended), or do you want Google/Apple OAuth too?
4. **Existing case-study assets:** the 6 placeholder SVGs in `public/work/` — replace with real uploads on A3, or migrate as-is and replace as real screens land?
5. **Migration cutover:** keep `cases.ts` / `posts.ts` as a fallback for 1 release after A3, or hard-cut?
6. **Lead capture:** ship A7's `lead` collection in v1 (replaces Nodemailer-only contact form) or defer to a follow-up release?
7. **Admin route protection:** mount admin at `codeminds.digital/admin` (this spec assumes), or a separate subdomain `admin.codeminds.digital`?

---

## What stays unchanged from the redesign roadmap

- Plasma Indigo palette + Geist + Instrument Serif (R1)
- Section anatomy (R2)
- Routes (R3)
- Case-study composables (R4)
- Animation primitives (`<SplitText>`, `<Magnetic>`, `<Tilt>`, `<DrawIcon>`, `<HeroCanvas>`, `<ViewTransitionLink>`)
- WebGL hero shader, Lenis scroll, GSAP ScrollTrigger
- Web Vitals + FrameBudget instrumentation
- Dynamic OG route (eventually reads Appwrite data instead of static defaults)

The backend layer is **purely additive** to the redesign. No section, route, or component is structurally rewritten — only the data source flips from `import` to `databases.listDocuments(...)`.

---

## What I'd revisit as the system grows

- **At 50+ case studies:** consider full-text search via Meilisearch or Typesense (Appwrite's search is basic)
- **At 5+ editors:** evaluate if Appwrite Cloud's free tier still fits; otherwise migrate to self-host
- **At i18n required:** dedicated `locale` attribute strategy vs per-locale documents — depends on translation memory needs
- **At product app scope:** Appwrite covers it natively (more collections + more functions), no migration needed
- **If real-time co-editing is critical** (multiple editors on same doc simultaneously): Appwrite doesn't have CRDT-level collab. Add Yjs or graduate to a collaborative editor backend
- **At enterprise scale** (1M+ docs, complex permissions, audit-heavy): consider migrating to Postgres-direct + custom admin (Payload-style)

---

## Phase summary

| Phase | Files / Functions | Visible outcome |
|---|---|---|
| A0 | ~6 files + 2 Appwrite Functions | Project live, schema versioned, webhook revalidation working |
| A1 | ~15 new files | Custom admin shell at `/admin` with auth and generic list/detail views |
| A2 | ~6 file edits | Site identity (logo, favicon, OG, contact, social) editable end-to-end |
| A3 | ~14 file edits | Case studies + journal posts in CMS; static data files retired |
| A4 | ~8 file edits | Every public string and image editable |
| A5 | ~12 new files + 6 edits | WYSIWYG long-form with TipTap + brand-bound custom marks |
| A6 | ~8 edits + 3 Functions | Multi-editor workflow, audit, scheduled publishing, Slack alerts |
| A7 | opt-in | Leads, dynamic OG from CMS, sitemap/RSS, A/B variants, i18n, self-host |

Total: **~80 file edits + ~5 Appwrite Functions across 7 active phases over ~10 weeks**. A7 is opt-in / on-demand.

Honest comparison: this is roughly 2× the implementation work of the Sanity spec for a similar end-state on the marketing CMS. The justification is the future product-app foundation laid by A7's `lead` collection — extending into a customer portal is a few more collections, not a new stack.
