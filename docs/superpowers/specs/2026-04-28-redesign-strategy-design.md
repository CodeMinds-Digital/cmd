# Codeminds Digital — End-to-End Redesign Strategy

**Date:** 2026-04-28
**Status:** Approved, ready for implementation planning
**Scope:** Full re-implementation of the public marketing site
**Estimated effort:** 5 phases (R1–R5), each independently shippable

---

## Decisions locked

| # | Question | Locked answer |
|---|---|---|
| 1 | Deliverable scope | **C** — Strategy doc + full re-implementation across 5 phases |
| 2 | Aesthetic direction | **D** — Premium Dark (Resn / Linear-pro tier) |
| 3 | Page IA | **B** — Hybrid: home + `/work/[slug]` + `/studio` + `/journal` |
| 4 | Audience priority | **A** primary (funded startups, $15k–$60k) + **D** secondary (other agencies, white-label) |
| 5 | Color palette | **2** — Plasma Indigo: charcoal + WebGL shader as ambient backdrop, indigo accent |
| 6 | Typography | **D** — Instrument Serif (display motif) + Geist (body) + Geist Mono (utility) |
| 7 | Content reality | 1 real case study (2 in progress), client logos coming, 2 anchor testimonial quotes, no team photo, real metrics on 2 projects |

## Audience and copy voice

**Primary:** funded startups (seed–Series A), $15k–$60k projects, care about speed and design quality.
**Secondary:** other agencies sub-contracting work, care about niche capability and discretion.

**Voice rules:**
- Read like a senior engineer who designs. No "award-winning experiences."
- Concrete > vague. "Two-week SwiftUI rebuilds" beats "mobile excellence."
- Active voice, present tense. "We ship X" not "We are passionate about Y."
- Numbers and constraints earn the right to be in headlines (`$15k–$60k · 2–4 weeks · Chennai`).
- Italic serif is reserved for one phrase per moment. *"Software, built with care."* — not whole sentences.

---

## R1 — Brand foundation

The token-cascade phase. Establishes the design system primitives that every downstream phase inherits.

### R1.1 Color tokens (replace `tailwind.config.js` palette)

Drop entirely: `neon`, `sunset`, `electric` color ramps. Add three semantic ramps:

```js
ink: {        // surface tones
  900: '#0a0a0c',   // page bg
  800: '#101013',   // section bg, cards
  700: '#17171b',   // elevated cards
  600: '#22222a',   // dividers
  500: '#3a3a45',   // muted borders
},
paper: {      // text on dark
  50:  '#f5f5f7',   // primary
  100: '#e8e8ed',   // body
  200: '#cfcfd9',   // secondary
  300: '#a5a5b4',   // dim / labels
  400: '#6b6c8a',   // mono utility
},
brand: {      // single accent — indigo
  300: '#c7d2fe',
  400: '#a5b4fc',   // canonical accent
  500: '#818cf8',
  600: '#6366f1',
},
```

Cyan retained only as a hardcoded uniform inside the WebGL shader (`HeroCanvas.tsx`'s `uColorC`). It is no longer a Tailwind class. Markup cannot reach it.

### R1.2 Typography

Three fonts via `next/font/google` in `src/app/layout.tsx`:

```ts
const geist = Geist({ variable: '--font-geist', display: 'swap', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', display: 'swap', subsets: ['latin'] });
const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
  subsets: ['latin'],
});
```

Tailwind family map:
```js
fontFamily: {
  sans:  ['var(--font-geist)',      'system-ui', 'sans-serif'],
  serif: ['var(--font-serif)',      'Georgia',    'serif'],
  mono:  ['var(--font-geist-mono)', 'ui-monospace','monospace'],
}
```

**Where each font lives:**
- Geist (sans): body, sub, UI chrome, buttons. Default everywhere.
- Geist Mono: eyebrows, captions, anchors (`v2026.1`, `01 ── SERVICES`), tabular data.
- Instrument Serif italic: motif, used sparingly. ~1 italic phrase per 1.5 viewports — hero accent word, section opener accent, anchor pull-quote. Never an entire heading.

**Type scale (major-third 1.25):**

| Token | Size / lh | Letter-spacing | Used for |
|---|---|---|---|
| `mono-xs` | 10 / 1.0 | +0.22em | eyebrows |
| `mono-sm` | 11 / 1.4 | +0.18em | captions, anchor strip |
| `body` | 15 / 1.6 | – | body |
| `lead` | 18 / 1.55 | – | hero subline, opener leads |
| `h3` | 24 / 1.2 | -0.01em | card titles |
| `h2` | 40 / 1.05 | -0.02em | section openers |
| `h1` | 72 / 0.95 | -0.025em | page H1 |
| `display` | 96 / 0.92 | -0.03em | hero serif italic moments |

### R1.3 Motion grammar

Codify the easings/durations already in use as named tokens.

**House easings:**
- `expo-out` `[0.16, 1, 0.3, 1]` — 95% of enter animations
- `quint-out` `[0.22, 1, 0.36, 1]` — clip-path reveals, draws
- `gentle` `[0.25, 0.1, 0.25, 1]` — fades

**Durations:** instant 100ms · snap 200ms · natural 450ms · reveal 900ms · ambient 20s+

**Single root config:** `<MotionConfig transition={{ ease: 'expoOut' }} reducedMotion="user">` at the root. All motion inherits the house easing unless overridden.

**Reduced motion + SSR:** `reducedMotion="user"` is paired with explicit `useReducedMotion()` guards inside any `useTransform`/`useScroll` hook so the React 19 / SSR collision that hid content earlier this month cannot recur. No `Math.random()` in render anywhere.

### R1.4 Spacing & rhythm

```
Vertical section padding: py-24 md:py-32 lg:py-40   (96 → 160px on desktop)
Horizontal gutter:        px-6  md:px-12  lg:px-20
Container max-width:      max-w-[1280px] mx-auto
```

Whitespace is the most expensive thing on a dark page; spend it.

### R1.5 Files touched

| File | Action |
|---|---|
| `tailwind.config.js` | Color tokens, fonts, fontSize scale, easings |
| `src/app/layout.tsx` | Font imports, `<MotionConfig>` at root, body class swap to `bg-ink-900 text-paper-100` |
| `src/styles/globals.css` | Dark `:root` token vars, dedup duplicate utilities |
| `src/components/animations/FloatingElements.tsx` | Delete (already unused) |
| `src/components/animations/ParticleField.tsx` | Delete (already unused) |

### R1.6 Out of scope for R1

Section copy, section count, route layout, HeroCanvas shader internals, motion primitive APIs.

---

## R2 — Home redesign

Cuts the home page from 9 sections to 5 and rewrites all copy to the new voice.

### R2.1 New section list

| # | Section | Replaces / fate |
|---|---|---|
| 1 | Hero | Rewritten — drops stats grid + emoji, keeps shader + Magnetic + SplitText |
| 2 | Selected Work (3 tiles) | Was Portfolio with 6 tiles → cut to 3 featured cases |
| 3 | Capabilities | Was Services — rebranded + restructured as numbered editorial rows |
| 4 | How We Work | Was Process — copy tightened to outcomes |
| 5 | Conversation | CallToAction + Contact merged into one closing moment |

**Moved off home:**
- About → `/studio`
- Testimonials → integrated into `/work/[slug]` cases + one anchor pull-quote inline above Conversation
- Blog → `/journal`

### R2.2 Hero copy + structure

```
Eyebrow:    ● BOOKING NEW PROJECTS                             [mono-xs paper-300]
Headline:   Software,                                          [h1 geist 700 paper-50]
            built with care.                                   ["care" = display serif italic]
Sub:        A digital studio for web, mobile, and AI.          [lead paper-200]
            Two-to-four-week delivery from Chennai → worldwide.
CTAs:       [Start a project →]                                [primary, magnetic + ripple]
            [See selected work]                                [ghost link]
Anchor:     CODEMINDS DIGITAL · v2026.1 · CHENNAI ─── SCROLL ↓ [mono-sm paper-400]
```

Removed: 4-card emoji stats grid (🚀 ⭐ ⚡ 🛡️). Replaced by stronger language in the sub.

### R2.3 Selected Work

Three editorial cards — 1 real case, 2 stubs labelled "Shipping May 2026". Each card: name, 1-line brief, tags, "Read case →" link. Tilt + clip-path reveal stay.

Stub-card variant: muted overlay, no tilt, anchor reads "In progress · ETA May 2026".

### R2.4 Capabilities (was Services)

Editorial row layout, not card grid:

```
01 / Web platforms      Next.js · Postgres · Tailwind
                        We rebuild slow marketing sites and ship product MVPs.

02 / Mobile             SwiftUI · React Native · Expo
                        iOS + Android in a single sprint.

03 / AI integration     OpenAI · embeddings · RAG
                        Practical AI features, not demos.

04 / Performance        Lighthouse 95+ · Core Web Vitals
                        Existing-stack rebuilds and audits.
```

Each row: number (mono-sm brand-400) · capability (h3 paper-50) · tags (mono-sm paper-400) · 1-line description (body paper-200).

### R2.5 How We Work

Keep current 4-step structure with the scrubbed SVG spine from Phase 2. Tighten copy:

| Step | Was | Becomes |
|---|---|---|
| 01 | "Discovery & Strategy — we transform ideas..." | "Brief — 1 week. We listen, scope, and price-fix." |
| 02 | "Design & Prototyping — our design team creates..." | "Design — 1–2 weeks. Mockups, prototype, sign-off." |
| 03 | "Development & Testing — we build..." | "Build — 2–4 weeks. Daily Looms, weekly demos." |
| 04 | "Launch & Optimization — we deploy..." | "Ship — week N+1. Monitoring, support, hand-off." |

### R2.6 Conversation (Contact + CallToAction merged)

```
Eyebrow:    ─── Let's talk

Headline:   Let's make                                  [h1 geist]
            something.                                  [display serif italic]

Two-column layout (collapses to one column at md):

Left column:                          Right column:
[Contact form, 4 fields:              cmd@codeminds.digital
 name, email, project, message]       Booking calendar link
                                      Chennai · IST · UTC+5:30
                                      We reply within 24h

Footer of section:
WE REPLY WITHIN 24H · CHENNAI · IST   [mono-sm paper-400]
```

### R2.7 Files touched

| File | Action |
|---|---|
| `src/components/sections/Hero.tsx` | Rewrite copy, drop stats grid + emoji |
| `Portfolio.tsx` → `SelectedWork.tsx` | Rename, cut 6 → 3 tiles, add stub variant |
| `Services.tsx` → `Capabilities.tsx` | Rename, replace card grid with numbered rows |
| `Process.tsx` | Copy rewrite only — structure stays |
| `Contact.tsx` + `CallToAction.tsx` → `Conversation.tsx` | Merge into single section |
| `About.tsx`, `Testimonials.tsx`, `Blog.tsx` | Remove from home (`page.tsx`) — full delete in R3 once routes exist |
| `src/app/page.tsx` | New 5-section list |

---

## R3 — Routes split

Wire up the multi-page IA.

### R3.1 New routes

| Route | Purpose |
|---|---|
| `/` | Home (5 sections from R2) |
| `/work` | Index of all case studies (grid of tiles) |
| `/work/[slug]` | Single case study (template defined in R4) |
| `/studio` | About page — founder/studio story, values, capabilities deep-dive |
| `/journal` | Blog index |
| `/journal/[slug]` | Single post |

### R3.2 Header

Compress nav to 4 items + 1 CTA:

```
[Codeminds Digital]    Work · Studio · Journal · Contact    [Start a project →]
```

Sticky-on-scroll-up, hides on scroll-down. CTA on the right is the magnetic primary button.

### R3.3 Footer (3-column)

```
Codeminds Digital            Work               Studio
Software studio              Selected           About
Chennai · IST                /work index        /studio

cmd@codeminds.digital        Journal            Legal
[phone — TBD]                All posts          Privacy
                                                Terms

CODEMINDS DIGITAL · v2026.1 · © 2026 — ALL RIGHTS RESERVED
```

### R3.4 View Transitions

Card-to-detail morph on `/work` tiles using Next 16's `unstable_ViewTransition` API (still experimental as of 16.2.4 — gate behind a feature flag if it ships unstable warnings in production). Tile image becomes the case-study hero image. Reduced-motion fallback = standard navigation, no morph. Browsers without View Transitions API support fall through to standard navigation as well — no polyfill.

### R3.5 Files created

```
src/app/work/page.tsx                       // /work index
src/app/work/[slug]/page.tsx                // template only — content from R4
src/app/studio/page.tsx                     // /studio
src/app/journal/page.tsx                    // /journal index
src/app/journal/[slug]/page.tsx             // /journal/[slug]
src/components/layout/Header.tsx            // compress nav
src/components/layout/Footer.tsx            // rebuild
src/components/work/CaseTile.tsx            // shared card used by home + /work
```

### R3.6 Files deleted

- `src/components/sections/About.tsx` — content moves to `/studio`
- `src/components/sections/Testimonials.tsx` — content folds into `/work/[slug]` cases
- `src/components/sections/Blog.tsx` — content moves to `/journal`

---

## R4 — Case study #1

Build the `/work/[slug]` template + ship the one real case end-to-end as the proof.

### R4.1 Template anatomy

```
1.  Hero block       — Project name (serif italic), 1-line brief, year, role, live link
2.  Cover media      — Full-bleed hero image / video, scroll-fade
3.  Project facts    — 3-column data: Client · Year · Stack · Duration
4.  Problem          — "Why was this hard?" — 1–2 paragraphs
5.  Approach         — Numbered list, matching Capabilities pattern
6.  Screens          — 3–6 full-width images with captions, scroll-reveal
7.  Result           — Big number callout (e.g. "+47% conversion · 1.6s LCP")
8.  Testimonial      — Pull-quote in serif italic, attributed
9.  Next case        — Big arrow link to next /work/[slug]
```

### R4.2 Content via MDX

Each case stored as `src/data/cases/[slug].mdx` with frontmatter:
```yaml
---
slug: acme-rebuild
client: Acme Inc
year: 2026
role: Lead engineer + designer
duration: 3 weeks
stack: [Next.js, Postgres, Tailwind, Framer Motion]
brief: We rebuilt their marketing site...
metrics:
  - { label: 'Conversion lift', value: '+47%' }
  - { label: 'LCP', value: '1.6s' }
testimonial:
  quote: "..."
  author: "..."
  role: "..."
liveUrl: https://...
---

## Problem
...
```

### R4.3 Files created

```
src/components/work/CaseHero.tsx
src/components/work/CaseFacts.tsx
src/components/work/CaseScreens.tsx
src/components/work/CaseMetric.tsx
src/components/work/CasePullquote.tsx
src/components/work/CaseNextLink.tsx
src/data/cases/<real-slug>.mdx          // the one real case (slug TBD)
src/data/cases/case-02-coming.mdx       // stub — "Shipping May 2026"
src/data/cases/case-03-coming.mdx       // stub — "Shipping May 2026"
```

---

## R5 — Polish

Final pass once content lands.

| Item | What |
|---|---|
| Logo wall | New `<LogoWall>` between Selected Work and Capabilities. Logos rendered in `paper-300` low-contrast (the grayscale ausdata move). Wires up when client provides logos. |
| Dynamic OG refresh | Update `/api/og/route.tsx` to dark plasma palette + Instrument Serif headline. Per-page variants: case study OG uses case name, journal post uses post title. |
| Lighthouse pass | Run `npm run lighthouse` against deployed URL. Targets: Performance 95+ desktop / 85+ mobile, Accessibility 100, INP <200ms, CLS <0.05. |
| Cross-browser QA | Safari 17+ (clip-path, view transitions, plasma backdrop, mix-blend ripple). Firefox. Mobile Safari (`min-h-dvh`, capability gate, touch). VoiceOver SR sweep. |
| Bundle audit | Re-run `npm run analyze`. Verify Three chunks isolated. Verify no font duplication. |
| README + spec | Update README to match new IA + brand. |

---

## Out of scope (deferred)

- **Hero ambient video** — needs a real shoot/render.
- **Lottie process icons** — `DrawIcon` covers the perceptual goal.
- **Variable-font morphing on hover** — requires a self-hosted variable font, low ROI.
- **Drag-to-reveal testimonial carousel** — testimonials live inside cases now; carousel not needed.
- **Bespoke portfolio AVIFs** — content task; placeholder strategy in R4 stubs.
- **/journal post template polish** — covered structurally in R3, content polish deferred until first real post is written.

## Open questions (require user input before R3 ships)

- Booking calendar link — Cal.com? Calendly? SavvyCal? Or just an email mailto?
- `/studio` page — does it include a hire / careers section now or later?
- Real client logos — when do they land? (Affects R5 logo-wall schedule.)
- Case study #1 actual content — slug, copy, screens, metrics, testimonial.

---

## Phase summary

| Phase | Files touched (rough) | Visible outcome |
|---|---|---|
| R1 | 4–5 | Site goes dark + Geist + indigo. No structural change. |
| R2 | ~10 | Coherent 5-section home page. Hero feels expensive. Emoji gone. |
| R3 | ~8 new | Multi-page IA. Compressed nav. Real footer. |
| R4 | ~7 new | First case study live. Template ready. |
| R5 | ~5 | Logo wall (when provided). OG refresh. Perf pass. Ship-ready. |

---

## What stays unchanged

- WebGL shader in `HeroCanvas.tsx` (already on-brand for Plasma Indigo)
- Motion primitives — `SplitText`, `Magnetic`, `Tilt`, `DrawIcon`, `SmoothScroll`, `CustomCursor` cascade through new tokens for free
- `next/og` infrastructure — only the visual template changes
- Web Vitals + Frame Budget instrumentation
- `next.config.js` allowedDevOrigins, image formats
- API routes (`/api/contact`, `/api/og`, `/api/vitals`)
- TypeScript / build pipeline

The redesign is mostly **data** (tokens, copy, IA), not new components.
