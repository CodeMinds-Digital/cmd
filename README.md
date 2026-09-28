# Codeminds Digital

Software studio website. Web, mobile, and AI for funded startups and other studios. Two-to-four-week delivery from Chennai → worldwide.

**Live:** [codeminds.digital](https://codeminds.digital) · **Status:** booking new projects

---

## Stack

- **Framework:** [Next.js 16.2.4](https://nextjs.org) (App Router · Turbopack · React 19 · React Compiler)
- **Type system:** TypeScript (strict)
- **Styling:** Tailwind CSS 4 (CSS-first `@theme` in `src/styles/globals.css`) with the Voltage semantic token system (`canvas` / `surface` / `fg` / `accent` …)
- **Motion:** Motion (`motion/react`, `LazyMotion` + `m.*`) + Lenis (smooth scroll)
- **Email:** Nodemailer (`/api/contact`)
- **Analytics:** Web Vitals → `/api/vitals`
- **OG cards:** `next/og` edge runtime, Voltage palette, per-route variants

## Routes

| Route | Purpose |
|---|---|
| `/` | Home — Hero · Selected Work · Logos · Capabilities · Process · Conversation |
| `/work` | All case studies index |
| `/work/[slug]` | Case study — facts · problem · approach · screens · result · pull-quote · next case |
| `/studio` | About — beliefs, stack, closing CTA |
| `/journal` | Notes from the studio |
| `/journal/[slug]` | Single post |
| `/playground` | Internal — animation primitive catalog |
| `/api/og` | Dynamic OG image (`?title=…&subtitle=…&eyebrow=…`) |
| `/api/contact` | Contact form sink (Nodemailer) |
| `/api/vitals` | Web Vitals beacon |

## Design system

**Palette — Voltage (light-first).** Tokens live in `@theme` in `src/styles/globals.css` as OKLCH `light-dark()` pairs; a dark variant is defined but not enabled (`:root { color-scheme: light }`).

```
canvas        #F2EFE8  page background (warm paper)
surface       #FFFFFF  tiles, cards, inputs
surface-sunk  #E8E4DA  wells, hover rows, chips
line          #111 @10%   hairlines   ·   line-strong  #111 @22%
fg            #111111  headings, body          16.4:1
fg-muted      #5C5A55  secondary text           6.0:1
fg-subtle     #64625C  mono labels (≥12px)      5.3:1
accent        #FF4D00  FILLS ONLY — never small text on canvas
accent-fg     #111111  text on accent fills     5.7:1
accent-ink    #B83700  orange text / links      5.1:1
inverse       #111111  black tiles / pills, with inverse-fg #F2EFE8
```

**Type:**

- **Space Grotesk** — display and headings (`font-display`; applied to `h1`–`h6` by default).
- **Geist (sans)** — body, UI, buttons. Default everywhere.
- **Geist Mono** — eyebrows, captions, anchors (`v2026.1`, `01 ── SERVICES`), tabular data. Minimum 12px.
- **Highlight chip** (`<Highlight>` / `highlightClass`) — orange block behind one key phrase per section ("care.", "what we ship."). Replaces the old serif-italic accent.

**Type scale:**
`mono-xs` (12/0.14em) → `mono-sm` (12/0.12em) → `body` (15) → `lead` (18) → `h3` (24) → `h2` (40) → `h1` (72) → `display` (96)

**Motion grammar:**

- House easings: `expo-out` `[0.16, 1, 0.3, 1]` (95% of enters), `quint-out` `[0.22, 1, 0.36, 1]` (clip-path), `gentle` `[0.25, 0.1, 0.25, 1]`
- Durations: `instant` 100ms · `snap` 200ms · `natural` 450ms · `reveal` 900ms
- Single `<MotionConfig reducedMotion="user">` at root + per-component `useReducedMotion()` guards on `useTransform` motion values

## Animation primitives

Located at `src/components/animations/` — internal preview at `/playground`:

| Primitive | Purpose |
|---|---|
| `<SplitText>` | Per-word reveal with `clip-path: inset(0 110% 0 0)` masks. Accepts inline elements as atomic words (so the italic accent rides inside the same staggered cascade). Screen-reader safe. |
| `<Magnetic>` | Pointer-pulled CTA wrapper + click ripple. Touch and reduced-motion bypass. |
| `<Tilt>` | Pointer-parallax 3D tilt for cards. |
| `<DrawIcon>` | Stroke-draws SVG paths on `whileInView` via `pathLength`. |
| `<SmoothScroll>` | Lenis smooth scroll (`autoRaf`), dynamically loaded post-hydration. |
| `<CustomCursor>` | Springy ring + dot, `mix-blend-difference`, `(pointer: fine)`-gated. |
| `<ViewTransitionLink>` | Wraps `next/link` with `document.startViewTransition()` for case-cover morphs. |
| `<MotionRoot>` | Root `<MotionConfig>` with house easing + reduced-motion=user. |
| `<SectionEyebrow>` | `01 ── LABEL` editorial section header chrome. |

## Performance

- **Smooth scroll:** Lenis loaded post-hydration via `<SmoothScrollLoader>`.
- **Fonts:** 3 self-hosted variable fonts via `next/font/google` (Space Grotesk · Geist · Geist Mono).
- **Images:** AVIF/WebP via `next/image`.
- **Web Vitals:** instrumented via `useReportWebVitals` → `/api/vitals` (with dev-mode color-coded console output). Long-task observer flags >50ms tasks in dev.
- **Targets:** LCP < 1.8s · INP < 200ms · CLS < 0.05 · Lighthouse 95+ desktop / 85+ mobile.

## Getting started

```bash
npm install
npm run dev          # dev server on http://localhost:3000
npm run build        # production build
npm run analyze      # webpack bundle analyzer (HTML report in .next/analyze/)
npm run lighthouse   # Lighthouse CLI against localhost (requires Chrome + lighthouse global)
```

## Project structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/{contact,og,vitals}/  # API routes
│   ├── work/                     # /work + /work/[slug]
│   ├── journal/                  # /journal + /journal/[slug]
│   ├── studio/                   # /studio
│   └── playground/               # internal primitive catalog
├── components/
│   ├── sections/                 # home page sections
│   ├── work/                     # case-study composables (CaseHero, CaseFacts, …)
│   ├── animations/               # motion primitives
│   ├── layout/                   # Header, Footer, CustomCursor
│   ├── perf/                     # WebVitals, FrameBudget
│   ├── icons/                    # IconSprite + <Icon>
│   ├── seo/                      # StructuredData
│   └── ui/                       # SectionEyebrow, primitives
├── data/
│   ├── cases.ts                  # case-study source of truth
│   └── posts.ts                  # journal posts
└── styles/
    └── globals.css
```

## Design spec

End-to-end strategy spec lives at [docs/superpowers/specs/2026-04-28-redesign-strategy-design.md](docs/superpowers/specs/2026-04-28-redesign-strategy-design.md). Captures the locked decisions (palette, typography, IA, audience) and the 5-phase rebuild plan.

## License

Proprietary — all rights reserved.
