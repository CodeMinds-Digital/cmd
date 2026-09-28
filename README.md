# Codeminds Digital

Software studio website. Web, mobile, and AI for funded startups and other studios. Two-to-four-week delivery from Chennai → worldwide.

**Live:** [codeminds.digital](https://codeminds.digital) · **Status:** booking new projects

---

## Stack

- **Framework:** [Next.js 16.2.4](https://nextjs.org) (App Router · Turbopack · React 19 · React Compiler)
- **Type system:** TypeScript (strict)
- **Styling:** Tailwind CSS 4 (CSS-first `@theme` in `src/styles/globals.css`) with a custom dark token system (`ink` / `paper` / `brand`)
- **Motion:** Motion (`motion/react`, `LazyMotion` + `m.*`) + Lenis (smooth scroll)
- **3D:** Three.js + `@react-three/fiber` + `@react-three/drei` (custom GLSL shader on the hero, capability-gated and lazy-loaded)
- **Email:** Nodemailer (`/api/contact`)
- **Analytics:** Web Vitals → `/api/vitals`
- **OG cards:** `next/og` edge runtime, Plasma Indigo palette, per-route variants

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

**Palette — Plasma Indigo (R1):**

```
ink-900  #0a0a0c  page background
ink-800  #101013  section / card surface
ink-700  #17171b  elevated cards
ink-600  #22222a  dividers
ink-500  #3a3a45  muted borders

paper-50   #f5f5f7  primary text
paper-100  #e8e8ed  body
paper-200  #cfcfd9  secondary
paper-300  #a5a5b4  dim / labels
paper-400  #6b6c8a  mono utility / anchor

brand-300  #c7d2fe  hover / active
brand-400  #a5b4fc  canonical accent
brand-500  #818cf8  primary fill
brand-600  #6366f1  pressed / WebGL shader uniform
```

**Type — Editorial pairing (R1):**

- **Geist (sans)** — body, UI, buttons. Default everywhere.
- **Geist Mono** — eyebrows, captions, anchors (`v2026.1`, `01 ── SERVICES`), tabular data.
- **Instrument Serif italic** — display-only motif. ~1 italic phrase per 1.5 viewports — hero accent word, section opener accent, anchor pull-quote. Never a full heading.

**Type scale (major-third 1.25):**
`mono-xs` (10/0.22em) → `mono-sm` (11/0.18em) → `body` (15) → `lead` (18) → `h3` (24) → `h2` (40) → `h1` (72) → `display` (96)

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
| `<HeroCanvas>` | Three.js shader (custom simplex-noise GLSL with scroll-driven `uScroll` uniform). Capability-gated: prefers-reduced-motion, viewport ≤ 640px, `hardwareConcurrency < 4`, or no WebGL → renders nothing, CSS gradient fallback takes over. |
| `<ViewTransitionLink>` | Wraps `next/link` with `document.startViewTransition()` for case-cover morphs. |
| `<MotionRoot>` | Root `<MotionConfig>` with house easing + reduced-motion=user. |
| `<SectionEyebrow>` | `01 ── LABEL` editorial section header chrome. |

## Performance

- **Bundle split:** Three.js + r3f + drei in their own chunks (~187 KB gz combined). Loads only when `<HeroCanvas>` mounts (capability-gated).
- **Smooth scroll:** Lenis loaded post-hydration via `<SmoothScrollLoader>`.
- **Fonts:** 3 self-hosted variable fonts via `next/font/google` (Geist · Geist Mono · Instrument Serif).
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
│   ├── three/                    # HeroCanvas (WebGL)
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
