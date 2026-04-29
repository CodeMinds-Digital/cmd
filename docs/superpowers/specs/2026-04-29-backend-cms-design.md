# Codeminds Digital — Backend CMS Design

**Date:** 2026-04-29
**Status:** Approved (Sanity), ready for implementation planning
**Scope:** Add a managed CMS for end-to-end editing of the marketing site (logo, app icons, favicons, metadata, all texts, case studies, journal, team, testimonials, logo wall, site settings)
**Estimated effort:** 6 phases (B0–B5), ~6 weeks total, each independently shippable

---

## Decision summary

| | Choice | Why |
|---|---|---|
| Backend | **Sanity** (hosted SaaS) | Editor UX is production-grade out of the box; schema-as-TypeScript matches existing typed data shapes; image pipeline replaces the current static SVG asset workflow at scale |
| Self-host fallback | Payload (only if SaaS becomes a constraint) | Same architecture, runs in same Node process, Postgres-backed |
| Rejected | Supabase, Appwrite, Strapi, Contentful, TinaCMS, Notion | Wrong fit — generic BaaS would force rebuilding Sanity Studio; enterprise CMSes price-out at this stage; blog-only or hobby-grade tools fail the case-study schema needs |

---

## Audience and editor jobs-to-be-done

**Primary editor:** non-technical agency staff (2–4 people).
**Secondary editor:** founder / lead engineer (1 person).

JTBD anchors:
- *"When a client signs an NDA, I want to swap their logo onto the wall without filing a ticket."*
- *"When I close a case study, I want to publish it the same day with screens + metric + quote without engineering hours."*
- *"When the editor breaks the schema, I want types to fail at the page level, not at runtime in production."*

These three jobs are why Supabase / Appwrite-style generic BaaS fails the brief.

---

## Architecture

```
┌────────────────────────────────────────────────┐
│  /studio  (Sanity Studio mounted in Next app)  │  ←  agency editors
│  Schema in /sanity/schemas/*.ts                │
│  Real-time collab · drafts · image hotspots    │
└─────────────────────┬──────────────────────────┘
                      │ writes (auth: GitHub SSO + email magic-link)
                      ▼
┌────────────────────────────────────────────────┐
│  Sanity Content Lake  (managed SaaS)           │
│  Datasets: production · preview                │
│  Asset CDN: cdn.sanity.io (multi-region edge)  │
└─────────────────────┬──────────────────────────┘
                      │
       ┌──────────────┴───────────────┐
       │                              │
       │ GROQ (read)                  │ webhook (publish event)
       ▼                              ▼
┌─────────────────────┐   ┌──────────────────────┐
│  Next.js 16 App     │   │  /api/revalidate     │
│  Router (Vercel)    │   │  revalidateTag(...)  │
│  Server components  │◄──┤  HMAC-verified       │
│  fetch + cache via  │   └──────────────────────┘
│  next: { tags }     │
└─────────────────────┘
```

**Read path (warm):** edge cache hit, zero CMS calls. Same speed as today's static site.
**Read path (cold):** server component fetches via GROQ from Sanity Content Lake (~30–80 ms typical), tags the cache, edge holds the result.
**Write path:** editor publishes in Studio → webhook to `/api/revalidate?tag=case:<slug>` → Next invalidates that tag → next request rebuilds and re-caches.

---

## Data model

```
siteSettings (singleton)
  ├ wordmark (image with hotspot)
  ├ favicon · appleTouchIcon · themeColor
  ├ ogImage · ogTitle · ogSubtitle (defaults; per-page overrides)
  ├ contactEmail · phone · bookingUrl
  └ socialHandles { twitter · github · linkedin }

caseStudy
  ├ slug · title · client · year · brief · tags
  ├ status (live | coming) · eta
  ├ cover (image + hotspot)
  ├ role · duration · liveUrl
  ├ problem (Portable Text)
  ├ approach[] { index · title · body }
  ├ screens[]  { image + hotspot · alt · caption }
  ├ metrics[]  { label · value }      // value regex-validated
  └ testimonial → reference(testimonial)

journalPost
  ├ slug · title · excerpt · publishedAt · readingTime
  ├ tags · cover (optional)
  ├ body (Portable Text — italic, mono, accent, pull-quote, code, image)
  └ author → reference(teamMember)

teamMember
  ├ name · role · bio · headshot
  └ socialHandles

testimonial            (reusable across cases + home pull-quote)
  ├ quote · author · role · company
  └ photo (optional)

clientLogo
  ├ name · logo (SVG/PNG)
  ├ ndaBound (boolean)               // hides from public render
  └ order

capability             (home Capabilities section rows)
  ├ index · title · tags · description

processStep            (home Process section steps)
  ├ index · title · body · duration
  ├ deliverables[]
  └ iconPath (SVG path d-attribute)

navItem
  └ label · href · location (header | footer-studio | footer-work | footer-contact | footer-legal)
```

Schema files use `defineType` + `defineField` from `@sanity/types`. Types generated via `sanity-codegen` into `src/types/sanity.ts` — single source of truth replaces the current handwritten `CaseStub` / `Post` interfaces in `src/data/*.ts`.

---

## Phased implementation plan

### **Phase B0 — Foundation** *(week 1, ~5 files)*

Goal: Studio mounted, schemas declared, deployed. No content migrated yet.

| Task | What |
|---|---|
| Install `next-sanity` + `@sanity/client` + `@sanity/image-url` + `sanity-codegen` | One-time |
| `sanity.config.ts` at repo root + `/sanity/schemas/` directory | Schema home |
| `app/studio/[[...tool]]/page.tsx` with `<NextStudio>` mount | Studio at `codeminds.digital/studio` |
| Define **siteSettings** + **navItem** schemas only | Smallest scope to validate the architecture |
| `/app/api/revalidate/route.ts` with HMAC verification | Sanity webhook → `revalidateTag` |
| Datasets: `production` + `preview` | Editors work in `preview`, publish promotes |
| Auth: GitHub SSO for engineer, magic-link for editors | Sanity Manage |

**Deliverable:** editing the wordmark / OG defaults in Studio updates the live site within ~2 seconds via webhook revalidation.

### **Phase B1 — Content as data** *(week 2, ~12 file edits)*

Goal: existing typed data in Sanity, pages read from there.

| Task | What |
|---|---|
| **caseStudy** + **journalPost** + **testimonial** + **teamMember** schemas | Mirror existing TypeScript types |
| One-time migration script | `cases.ts` + `posts.ts` → `client.createOrReplace` |
| Refactor `/work`, `/work/[slug]`, `/journal`, `/journal/[slug]` to fetch via GROQ | Server components, `next: { tags }` cache |
| Image pipeline integration | `<Image src={urlFor(case.cover).width(1200).format('webp').url()}>` |
| `sanity-codegen` → `src/types/sanity.ts` | Replaces handwritten types |
| Delete `src/data/cases.ts` and `src/data/posts.ts` | Single source of truth |
| Re-upload `public/work/*.svg` covers as Sanity assets | Studio uploads with hotspot |

**Deliverable:** all case studies + journal posts editable in Studio; engineering no longer touches code to add a new case.

### **Phase B2 — Reusable content blocks** *(week 3, ~8 file edits)*

Goal: every public string and image on the marketing site is editable.

| Task | What |
|---|---|
| **capability** schema + connect Capabilities section | 4 hardcoded rows → CMS |
| **processStep** schema + connect Process section | 4 steps + DrawIcon path strings → CMS |
| **clientLogo** schema with `ndaBound` gate + connect LogoWall | Editor uploads logo, ticks NDA to hide |
| Hero copy + Conversation copy → siteSettings strings | Hero headline, subline, CTAs editable |
| **navItem** populates Header + Footer | Editor reorders nav |

**Deliverable:** zero hardcoded marketing copy left in components.

### **Phase B3 — Editorial richness** *(week 4, ~10 file edits)*

Goal: long-form content gets first-class WYSIWYG editing.

| Task | What |
|---|---|
| Portable Text schema with **custom marks** | `serif-italic`, `monospace`, `accent`, `pull-quote`, `code` — each maps to a design token |
| Inline images in Portable Text with hotspot | Case-study screens inline in long-form |
| Visual Editing overlay (Sanity Live Preview) | Click any text on the live site, jump to Studio with that field focused |
| Preview routes: `/preview/work/[slug]` and `/preview/journal/[slug]` | Drafts visible before publish |
| Custom Studio components for the metric value preview | "+47%" rendered in same Geist 700 + display size as live site |
| Block schemas for hero/section variants | Editor toggles which blocks appear on home |

**Deliverable:** editors author case studies and journal posts in WYSIWYG that renders identically to the live site, with brand constraints enforced by the schema.

### **Phase B4 — Workflow & permissions** *(week 5, ~6 file edits)*

Goal: multiple editors, safely.

| Task | What |
|---|---|
| Roles: `viewer` · `writer` · `editor` · `admin` | Sanity ACL |
| `writer` saves drafts only · `editor` publishes · `admin` controls schema | Sanity workflow plugin |
| Audit log surfaced in Studio panel | Sanity History API |
| Scheduled publishing | Embargo cases until launch |
| Two-stage review on `caseStudy` | Required reviewer before publish |
| Slack webhook on publish events | "Marketing rebuild for Acme just went live →" |

**Deliverable:** founder + 2–3 agency staff can edit safely with separation of duties.

### **Phase B5 — Power features** *(week 6+, opt-in)*

| Item | Why |
|---|---|
| Sanity i18n plugin | If/when you take international clients |
| Hero copy A/B variants | Same site, two headlines, PostHog-driven split |
| Per-case dynamic OG | Already wired in [api/og](src/app/api/og/route.tsx); now reads case fields from Sanity |
| PostHog event integration | Track which CTA / case / capability converts |
| Sitemap + RSS auto-gen from Sanity | One source of truth for SEO |
| Robots.txt + structured data from siteSettings | StructuredData component already exists; rewire to read from CMS |

---

## Design-system integration

The Plasma Indigo + Geist + Instrument Serif system from R1 stays the source of truth. Sanity becomes the **binding layer** between editor intent and design tokens.

Three concrete moves:
1. **Custom Portable Text marks** map to design tokens. The "italic accent" mark in Studio renders as `<span class="font-serif italic text-brand-400">`. Editors pick a *brand role*, not a hex value or font family.
2. **Image hotspots are required** at schema level. A wide screenshot uploaded with a hotspot renders cleanly at 4:3 (tile) and 16:9 (case hero) without manual cropping.
3. **Schema-level constraints** mirror the type scale. `caseStudy.title.maxLength = 60` (fits the h1/display token). `metric.value.regex` enforces numeric+unit. These guardrails replace the design-review step.

---

## Trade-offs (explicit)

| Decision | Cost | Why accepted |
|---|---|---|
| SaaS dependency on Sanity | Vendor lock-in, monthly bill once growth justifies paid tier | Editor UX gain outweighs lock-in for a marketing site at this scale |
| GROQ over SQL | Learning curve, no joins | Document model fits editorial content shape |
| Studio mounted at `/studio` route | Studio JS adds to client bundle on that route only | Auth-gated, never hit by public users |
| Webhook-revalidation > on-read fetch | Webhook can fail silently; rare seconds-long stale window | Performance gain from edge-cached SSG is worth the worst-case |
| Image hotspots required on every upload | Adds a step to editor workflow | Eliminates a class of design-break bugs |
| Codegen instead of handwritten types | Build step dependency | Drift bugs in production are worse |

---

## Open questions (need user input before B0 ships)

1. **Studio location:** `codeminds.digital/studio` (same Next app, what this spec assumes) or `studio.codeminds.digital` (separate Vercel project)?
2. **Plan tier:** start on free (3 users, sufficient for current team) or jump to Growth ($99/mo, unlimited users + roles + scheduled publishing) immediately?
3. **Existing case-study assets:** the 6 placeholder SVGs in `public/work/` — replace with real uploads on B1, or keep as fallback assets and migrate as real screens land?
4. **Auth provider:** Sanity's built-in (email magic-link) only, or do you want GitHub SSO for the engineer?
5. **Migration cutover:** keep `cases.ts` / `posts.ts` as a fallback for 1 release after B1, or hard-cut?

---

## What stays unchanged from the redesign roadmap

- Plasma Indigo palette + Geist + Instrument Serif (R1)
- Section anatomy (R2 — Hero, Selected Work, Logos, Capabilities, Process, Conversation)
- Routes (R3 — `/work`, `/work/[slug]`, `/studio`, `/journal`, `/journal/[slug]`)
- `<CaseHero>`, `<CaseFacts>`, `<CaseScreens>`, `<CaseMetric>`, `<CasePullquote>`, `<CaseNextLink>` (R4 — only the data source changes)
- Animation primitives (`<SplitText>`, `<Magnetic>`, `<Tilt>`, `<DrawIcon>`, `<HeroCanvas>`, `<ViewTransitionLink>`)
- WebGL hero shader, Lenis scroll, GSAP ScrollTrigger
- Web Vitals + FrameBudget instrumentation
- Dynamic OG route (eventually reads CMS data instead of static defaults)

The CMS layer is **purely additive** to the redesign. No section, route, or component is structurally rewritten — only the data source flips from `import` to `client.fetch`.

---

## What I'd revisit as the system grows

- **At 50+ case studies:** category/tag taxonomies as their own schema; faceted search via Algolia
- **At 5+ editors:** custom approval workflow plugin or graduate to Sanity enterprise
- **At i18n required:** evaluate `@sanity/document-internationalization` vs per-locale documents
- **If self-hosting becomes hard requirement:** migrate to Payload — schemas transfer cleanly
- **If real-time co-editing breaks under load (>3 simultaneous editors on same doc):** Sanity has a presence + locks pattern
- **If site grows to a product CMS** (e-commerce, gated content, login): Sanity is wrong tool. Postgres + custom admin then.

---

## Phase summary

| Phase | Files touched (rough) | Visible outcome |
|---|---|---|
| B0 | ~5 | Studio at `/studio`, site settings + nav editable |
| B1 | ~12 | Case studies + journal posts editable; static data files retired |
| B2 | ~8 | Every public string and image editable |
| B3 | ~10 | WYSIWYG long-form editing with brand constraints |
| B4 | ~6 | Multi-editor workflow with permissions and audit |
| B5 | opt-in | i18n, A/B, PostHog, sitemap, structured data from CMS |

Total: ~41 file edits across 5 active phases over ~5 weeks. B5 is opt-in, on-demand.
