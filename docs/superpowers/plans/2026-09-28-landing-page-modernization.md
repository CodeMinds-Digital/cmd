# Landing Page Modernization (2026 stack) — Implementation Plan

**Date:** 2026-09-28
**Status:** Draft v2 — theme locked to **Voltage**, awaiting approval to start Phase 0
**Scope:** The home route `/` and its shared chrome (Header, Footer, root layout). Because the theme flips from dark to light, `/work`, `/studio`, and `/journal` **must be migrated to the new tokens** so they stay legible. They get no layout redesign here.
**Builds on:** [2026-04-28 redesign strategy](../specs/2026-04-28-redesign-strategy-design.md). The **voice rules, copy, audience, and home IA carry over unchanged**. That spec's R1 visual decisions are **superseded** by §3 below: Plasma Indigo palette (decision 5), Instrument Serif motif (decision 6), and the dark-only premise (decision 2).

---

## 0. Decision log

| # | Decision | Answer | Date |
|---|---|---|---|
| V1 | Theme direction | **Voltage** — light warm paper, black ink, electric orange, bento layout. Chosen over Signal (terminal), Blueprint (cobalt drawing), and Plasma evolved. | 2026-09-28 |
| V2 | Default scheme | **Light-first.** A dark variant is defined in tokens; whether it ships is open question Q3. | 2026-09-28 |
| V3 | Hero backdrop | **WebGL shader removed.** The bento hero *is* the visual, so `three`, `@react-three/fiber`, and `drei` are uninstalled. | 2026-09-28 |

---

## 1. Where the project stands

The site already runs Next.js 16.2 with the App Router, Turbopack, React 19.2, and strict TypeScript. So this is not a rewrite from a legacy stack. The job is:

1. Apply a new visual identity (Voltage).
2. Take out the 2024–25 layers that are now outdated, overweight, or duplicated.
3. Put 2026 platform-native patterns in their place.

### Current home composition (`src/app/page.tsx`)

| # | Section | File | Intent to preserve |
|---|---|---|---|
| — | Header | `layout/Header.tsx` | Wordmark · Work/Studio/Journal · "Start a project" pill · hide-on-scroll-down |
| 1 | Hero | `sections/Hero.tsx` | "Booking new projects" status · *Software, built with **care.*** · sub · 2 CTAs · mono anchor strip |
| 2 | Selected Work | `sections/SelectedWork.tsx` + `work/CaseTile.tsx` | 3 case tiles (1 live, 2 "coming"), view-transition morph into `/work/[slug]` |
| 3 | Logo Wall | `sections/LogoWall.tsx` | Trust strip |
| 4 | Capabilities | `sections/Capabilities.tsx` | 4 numbered capabilities |
| 5 | Process | `sections/Process.tsx` | 4 steps, Brief → Design → Build → Ship |
| 6 | Conversation | `sections/Conversation.tsx` | "Let's make something." · form + direct channels |
| — | Footer | `layout/Footer.tsx` | Big wordmark · 4 link columns · anchor strip |

### Debt found while studying the code

| Area | Finding | Impact |
|---|---|---|
| Tokens | Colors are named by **dark-theme role**: `ink-*` is the background and `paper-*` is the text. They are used in **26 files** across every route. A light theme can't reuse these names without inverting their meaning. | Needs a semantic-token migration (Phase 1b) |
| Styling | Tailwind **3.4** with a JS config. It also has a legacy `neutral`/`brand-50..900` ramp, legacy `.heading-*`/`.card`/`.glass` classes, and **two** conflicting `.text-body` definitions. | Token drift, specificity surprises |
| Motion | `framer-motion@11` has been superseded by `motion` (v12, `motion/react`). Every section is a client component just to animate. | Extra JS; sections can't stay RSC |
| Scroll | Lenis + **GSAP**. GSAP is used *only* to drive Lenis's RAF ticker. | ~30 KB gz for a ticker |
| 3D | `three` + r3f + drei (~187 KB gz) for one 2D fragment shader. It also globally patches `console.warn`. | Heaviest chunk. Removed entirely under Voltage. |
| Hero | The status pill is gated behind a post-hydration `isLoaded` state. The H1 is masked at `y:110%` until JS runs. | LCP waits on JS |
| Header | The scroll listener calls `setState` on every scroll event | A re-render every frame |
| Mobile menu | Custom height animation. No focus trap, no Esc to close, no inert background. | a11y gap |
| Contact | `/api/contact` **interpolates `name`/`message` into email HTML without escaping**. It falls back to placeholder Gmail creds, drops the `project` field, and has no rate limit, honeypot, or schema validation. | Security + data loss |
| Hardcoded palette | `api/og/route.tsx` has hex constants for the dark palette. `public/work/*.svg` case covers use indigo gradients. `layout.tsx` sets `theme-color #0a0a0c` / `color-scheme: dark`. | All must be re-themed |
| Dead code | `ScrollReveal.tsx` and `LoadingAnimation.tsx` are unused on home. `index.js` sits at the repo root. Legacy font sizes remain in the config. | Noise |
| Content | The logo wall shows **unlicensed third-party names** (Vercel, Linear, Anthropic, Stripe…) as placeholder "clients" | Legal/credibility risk |

---

## 2. Target 2026 stack

| Layer | Now | Target | Why |
|---|---|---|---|
| Framework | Next 16.2 | Next 16.x + **React Compiler** (`reactCompiler: true`) + **`cacheComponents`/PPR** | Auto-memoization; static shell with streamed islands |
| Styling | Tailwind 3.4 + JS config | **Tailwind v4**: CSS-first `@theme`, native container queries, `@starting-style` variants | One source of truth in CSS, faster builds |
| Color | Hex ramps named by dark role | **Semantic OKLCH tokens** (`canvas`, `surface`, `fg`, `accent`…), `color-mix()` for states, and `light-dark()` so a dark variant can exist | Theme-agnostic names; one block per scheme |
| Motion (JS) | framer-motion 11 | **`motion` v12** via `LazyMotion` + `m.*` (`domAnimation`) | Only interactive islands pay for motion JS |
| Motion (CSS) | — | **Scroll-driven animations** (`animation-timeline: view()/scroll()`), progressive via `@supports` | Zero-JS, compositor-thread |
| Page transitions | Hand-rolled `document.startViewTransition` | **React `<ViewTransition>`** (Next 16 `experimental.viewTransition`), with the current helper as fallback | Declarative case-cover morph from bento tile |
| Smooth scroll | Lenis + GSAP | **Lenis only** (`autoRaf`), `(pointer: fine)` + no-reduced-motion. **GSAP removed.** | −30 KB |
| Hero backdrop | three + r3f + drei | **None.** The bento grid is the hero. Optional CSS grain via an inline SVG `feTurbulence` data-URI. | **−229 KB gz** (measured) |
| Forms | `fetch` + `useState` | **Server Action + `useActionState` + `useFormStatus` + `useOptimistic`**, a **Zod** schema shared client/server, a honeypot, and an IP rate limit | Works without JS, typed, and fixes the injection bug |
| Overlays | Custom mobile menu | **Popover API** / `<dialog>` + `@starting-style` + `interpolate-size: allow-keywords` | Native focus, Esc, and top layer |
| Tooling | ESLint 9 | + **Playwright** (visual + `@axe-core/playwright`) + **Lighthouse CI** budgets | Regression safety |

**Explicitly not adopting:**
- a component library (shadcn/Radix), because the look is bespoke;
- GSAP timelines;
- a smooth-scroll hijack on touch devices;
- a CMS. The Sanity spec stays a separate track, and the data modules here are shaped to swap in later.

---

## 3. Visual identity — Voltage

**Character:** confident, friendly, product-grade. It should feel like a well-funded startup's own site, not an agency showreel: warm paper, heavy black type, one loud orange, information packed into bento blocks. Personality comes from **layout and color blocking**, not effects.

### 3.1 Color tokens (light — default)

Defined once in `@theme` as OKLCH. The hex is shown for design parity. Contrast is measured against `canvas` unless noted.

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--color-canvas` | `#F2EFE8` | Page background (warm paper) | — |
| `--color-surface` | `#FFFFFF` | Bento tiles, cards, inputs | — |
| `--color-surface-sunk` | `#E8E4DA` | Wells, hover backgrounds, tag chips | — |
| `--color-line` | `#111111` @ 10% | Hairlines, tile borders | — |
| `--color-line-strong` | `#111111` @ 22% | Input borders, dividers | — |
| `--color-fg` | `#111111` | Headlines, body | ≈ 16.4 : 1 ✅ |
| `--color-fg-muted` | `#5C5A55` | Secondary text, captions | ≈ 6.0 : 1 ✅ |
| `--color-fg-subtle` | `#6B6963` | Mono labels (min 12 px) | ≈ 4.8 : 1 ✅ |
| `--color-accent` | `#FF4D00` | **Fills only**: highlight chips, stat tile, CTA hover, focus ring | — |
| `--color-accent-fg` | `#111111` | Text *on* accent at small sizes | ≈ 6.3 : 1 ✅ |
| `--color-accent-ink` | `#B83700` | Orange **text/links** on paper | ≈ 5.1 : 1 ✅ |
| `--color-inverse` | `#111111` | Inverted tiles/sections (dark blocks) | — |
| `--color-inverse-fg` | `#F2EFE8` | Text on inverse | ≈ 16.4 : 1 ✅ |

**Accent rules (enforced in review):**
- `#FF4D00` is **never** used for small text on paper (≈2.9:1 fails AA).
- White on `#FF4D00` is ≈3.3:1, so it's allowed **only** for large display text (≥24 px bold). The hero "care." chip qualifies. Everything smaller on orange uses `#111`.
- One orange moment per viewport, plus a CTA hover. Orange is a spotlight, not a theme wash.
- Selection: `accent` background with `accent-fg` text. Focus ring: 2 px `accent` + 2 px `canvas` offset.

### 3.2 Dark variant (defined, ship-gated — see Q3)

`light-dark()` pairs are defined for each token: canvas `#111111`, surface `#1A1A19`, fg `#F2EFE8`, fg-muted `#A8A59C`, and accent unchanged. Accent-ink becomes `#FF7A3D` on dark. Nothing in markup references a hex, so enabling it is a one-line change in `color-scheme`.

### 3.3 Typography

| Role | Font | Notes |
|---|---|---|
| Display + headings | **Space Grotesk** 500/700 (variable, `next/font/google`) | Tight tracking (−0.03em at display). This is the Voltage voice. |
| Body + UI | **Geist** 400/500 (already self-hosted) | Space Grotesk at body sizes is too quirky; Geist keeps it readable |
| Labels, stats units, anchors | **Geist Mono** 400 (already self-hosted) | Uppercase, +0.12em, min 12 px (up from 10 px for a11y) |
| ~~Instrument Serif~~ | **Removed** | The italic "accent word" motif is replaced by the **orange highlight chip** (see 3.5) |

Fluid scale (`clamp()`, Utopia-style, 360 → 1440 px):

| Step | Min → Max | Use |
|---|---|---|
| `--step-6` | 48 → 128 px | Hero H1 |
| `--step-5` | 40 → 88 px | Closing "Let's make something.", footer wordmark |
| `--step-4` | 32 → 56 px | Section headings |
| `--step-3` | 28 → 40 px | Stat numerals in bento tiles |
| `--step-1` | 18 → 22 px | Lead |
| `--step-0` | 16 → 17 px | Body |
| `--step--1` | 12 → 13 px | Mono labels |

### 3.4 Shape, space, surface

- **Radius:** tiles `20px`, inner elements `12px`, buttons/chips fully rounded (`999px`). Nested radius = outer − padding.
- **Borders over shadows:** 1 px `line` on every tile. On hover a tile lifts with `translateY(-2px)` and a single soft shadow `0 8px 24px -12px rgb(17 17 17 / 0.18)`.
- **Bento gap:** `clamp(8px, 1vw, 14px)`, which is tight so the grid reads as one object.
- **Grain (optional):** a 3% SVG noise overlay on `canvas` only, for paper warmth. Removed under `prefers-reduced-transparency`.
- **Section rhythm:** paper sections alternate with **one inverse (black) section** — Process — for contrast. The Conversation section sits on a full-bleed orange band.

### 3.5 Signature moments (what makes it Voltage and not a template)

1. **The highlight chip.** Key words sit in an orange rounded rectangle that **wipes in** from left to right (`clip-path` inset, 600 ms `expo-out`) as the line enters. It's used once per section: hero "care.", "what we ship.", "in 2–4 weeks.", "something."
2. **Hero bento.** The headline tile, a **"2–4 WEEK DELIVERY"** orange stat tile with a ticking numeral, a black **WEB · MOBILE · AI** tile, a live **"Booking — 2 slots in Oct"** status tile (pulsing dot, value from `data/site.ts`), and a **local time in Chennai** tile (`Intl.DateTimeFormat`, updated every minute; this is the only client island in the hero).
3. **Pointer-aware tiles.** On `(pointer: fine)`, a soft orange radial glow follows the cursor *inside* the hovered tile (CSS `--x/--y` via one delegated listener, no React state).
4. **Black pill buttons.** Primary = black pill, which turns orange with a black label on hover, and the arrow slides. Secondary = outlined pill.
5. **Stamp cursor (optional, desktop).** A small 10 px black dot that becomes an orange "OPEN →" label over case tiles. It replaces the current `mix-blend-difference` ring, which doesn't work on light backgrounds.

### 3.6 Motion character

Snappier and more physical than the old cinematic grammar.

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(.16,1,.3,1)` (expo-out, kept) | Reveals, chip wipe |
| `--ease-spring` | `motion` spring `{ stiffness: 400, damping: 30 }` | Tile hover lift, magnetic CTA, menu |
| `--dur-snap / natural / reveal` | 160 / 320 / 600 ms | Shortened from 200/450/900 |
| Tile entrance | `view()` timeline: `opacity 0→1`, `translateY 16px→0`, `scale .98→1`, staggered by `--i` | Bento grids |
| Numeral tick | CSS `@property --n` integer counter, animated 0 → target on `view()` | Stat tiles |

Reduced motion keeps the global safety net plus `MotionConfig reducedMotion="user"`. All scroll-driven rules sit inside `@media (prefers-reduced-motion: no-preference)`. Final states are the default styles, so content is never hidden.

---

## 4. Section-by-section design (structure kept, presentation new)

| Section | Voltage treatment |
|---|---|
| **Header** | Transparent over paper. After 80 px it condenses into a floating white pill with a `line` border (a scroll-driven animation on `scroll()`). Left: `● codeminds` wordmark. Center: Work · Studio · Journal. Right: black "Start a project" pill. Mobile: a popover sheet from the top with large Space Grotesk links and a full-width black CTA. |
| **Hero** | A 12-col bento, 2 rows on desktop. Headline tile (7 cols × 2 rows, white, H1 bottom-aligned, "care." chip) · orange **2–4 wk** stat tile · black **WEB · MOBILE · AI** tile · **Booking** status tile · **Chennai time** tile. Below the grid: two CTAs and the mono anchor strip `CODEMINDS DIGITAL · v2026.1 · CHENNAI → WORLDWIDE`. On mobile the tiles stack headline-first, and the stat tiles collapse into a two-up row. |
| **Selected Work** | A bento: the live case is a large tile (8 cols) with its cover, title, a metric chip ("Lighthouse 41 → 98"-style, from `cases.ts` metrics), and a "Read case →" pill. The two "coming" tiles (4 cols, stacked) use the `surface-sunk` fill, an orange "ETA May 2026" chip, and no link. The cover tile carries `<ViewTransition name="case-{slug}">`. |
| **Trust strip** | If there are **≥ 4 approved logos**, a monochrome logo marquee (`fg-muted`, CSS keyframes, `mask-image` edge fade, pauses on hover). **Otherwise** a row of 3 white stat tiles: *Lighthouse 95+* · *2–4 week delivery* · *Chennai → worldwide*. |
| **Capabilities** | A 2×2 bento of white tiles, each with an index `01`, title, one-line description, and tag chips (`surface-sunk`). Hover/focus reveals a "proof point" line via `interpolate-size`. On touch it's always visible. |
| **Process** | **Inverse section** (black canvas, paper text). A horizontal 4-step track on ≥1024 px, with an orange progress bar driven by `view()` as the section scrolls through. Steps are dark tiles with a duration chip and deliverables. On mobile it's a vertical list with a left rail. |
| **Conversation** | A full-bleed **orange band** with a black headline, "Let's make **something.**" The chip is inverted to a black chip with paper text. Inside: a white form tile (name, email, *what you're building*, budget pills, timeline pills, message) next to a black tile of direct channels (email, cal.com, location, response time). |
| **Footer** | Paper background, and an oversized `codeminds` wordmark in black that clips at the bottom edge. It has 4 link columns and the anchor strip. The dead `/legal/*` links are fixed or removed. |

---

## 5. Target architecture

```
src/
├── app/
│   ├── layout.tsx               RSC · fonts (Space Grotesk, Geist, Geist Mono) · color-scheme: light · MotionProvider island
│   ├── page.tsx                 RSC · composes sections
│   └── actions/contact.ts       'use server' — Zod, honeypot, rate-limit, escaped email
├── components/
│   ├── sections/                ALL RSC
│   │   ├── Hero.tsx             bento markup + <ChennaiClock/> + <MagneticCTA/>
│   │   ├── SelectedWork.tsx
│   │   ├── TrustStrip.tsx       marquee | stat tiles (replaces LogoWall)
│   │   ├── Capabilities.tsx
│   │   ├── Process.tsx          inverse section
│   │   └── Conversation.tsx     RSC shell + <ContactForm/>
│   ├── islands/                 the ONLY client components on / (target ≤ 6)
│   │   ├── ChennaiClock.tsx
│   │   ├── MagneticCTA.tsx      motion/react m.*
│   │   ├── TileGlow.tsx         one delegated pointer listener → CSS vars
│   │   ├── ContactForm.tsx      useActionState / useFormStatus / useOptimistic
│   │   ├── HeaderController.tsx IO sentinel → data-attr (hide on scroll down)
│   │   └── SmoothScroll.tsx     Lenis autoRaf, pointer-fine only
│   ├── ui/                      Bento, Tile, Button, Chip, Highlight, Eyebrow, Marquee, Stat
│   └── layout/                  Header (RSC + popover), Footer (RSC)
├── data/                        cases.ts, capabilities.ts, process.ts, logos.ts, site.ts
├── lib/                         contact-schema.ts, rate-limit.ts, escape-html.ts
└── styles/
    ├── globals.css              @import "tailwindcss"; @theme { semantic OKLCH tokens }
    └── motion.css               scroll-driven, @starting-style, @property counters, reduced-motion
```

**Deleted:** `components/three/HeroCanvas.tsx`, `animations/ScrollReveal.tsx`, `animations/LoadingAnimation.tsx`, `animations/Tilt.tsx` (replaced by tile lift + glow), and root `index.js`.
**Uninstalled:** `three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`, `gsap`, `framer-motion` (→ `motion`).

---

## 6. Phased execution

Each phase is independently shippable. Phase 0 snapshots are **"before" references**, not match targets, because the look changes on purpose.

### Phase 0 — Baseline & safety net (0.5 day) — ✅ done 2026-09-28, see [baseline](../../perf/2026-09-baseline.md)
- [x] Playwright: full-page screenshots of `/`, `/work`, `/work/[slug]`, `/studio`, and `/journal` at 375 / 768 / 1280 / 1920, with reduced motion on and off. Run an axe scan.
- [x] Record the Lighthouse (mobile + desktop), bundle-analyzer, and Web Vitals baseline in `docs/perf/2026-09-baseline.md`.
- [x] **Hotfix, independent of the redesign:** escape HTML in `/api/contact`. Fail closed when `EMAIL_USER`/`EMAIL_PASS` are missing. Include the `project` field.
- [x] Hide the placeholder third-party logo names in production until real logos are approved.

### Phase 1a — Toolchain upgrade (1 day) — ✅ done 2026-09-28
- [x] Tailwind 3.4 → v4.3 via `npx @tailwindcss/upgrade`, with `@tailwindcss/postcss` (autoprefixer removed). `tailwind.config.js` deleted; tokens now live in `@theme` in `globals.css`.
- [x] `framer-motion` → `motion` v13 (`motion/react`) in 12 files. All `motion.*` became `m.*` under `LazyMotion features={domAnimation} strict`. `CustomCursor` moved inside `MotionRoot`.
- [x] `reactCompiler: true` (+ `babel-plugin-react-compiler`). The only bailouts are in `HeroCanvas` (deleted in 1b) and the Hero mount gate (rebuilt in Phase 3), both suppressed with a reason.
- [x] `gsap` uninstalled; Lenis uses `autoRaf`.
- [x] Deleted `ScrollReveal.tsx`, `LoadingAnimation.tsx`, and root `index.js`. `Tilt` and `HeroCanvas` stay until the phases that replace them.
- [x] **Added:** ESLint 9 flat config (`eslint.config.mjs`, `next/core-web-vitals` + `next/typescript`, which includes the React Compiler rules). `npm run lint` → `eslint .`, clean.
- [x] **Added:** `outputFileTracingRoot` / `turbopack.root` pinned to the project (a stray `~/package-lock.json` was being picked as the workspace root).
- [x] **Added:** `tests/baseline/compare.mjs` pixel-diff tool, and `SCREENSHOT_DIR` override for comparison captures.
- **Exit: met.** All 40 screenshots are **0.000% pixel diff** against the Phase 0 baseline. Motion smoke test matches baseline: word reveal, header hide, cursor springs, Lenis, and mobile menu open/close-on-navigate all work, with no console errors. Home JS 503 → **476 KB gz**; other routes 274 → **246 KB gz**.

**Tailwind v4 regressions caught by the pixel diff and fixed** (none were flagged by the upgrade tool):

| Regression | Cause | Fix |
|---|---|---|
| Whole site rendered in the system font | `@theme` resolves `--font-sans: var(--font-geist)` at `:root`, but next/font sets `--font-geist` on `<body>` | Font tokens moved to `@theme inline` |
| Serif font var was self-referential | Tailwind's `--font-serif` and next/font's `--font-serif` share a name | next/font variable renamed `--font-instrument-serif` |
| `bg-ink-*` would resolve to an invalid value | Legacy `:root { --color-ink-900: 10 10 12 }` RGB-triplet vars shadowed v4's theme vars | Triplet block removed; `rgb(var(--x) / a)` → `var(--x)` / `color-mix()` |
| `space-y-*` stopped spacing (−24 px per footer column) | v4 wraps it in zero-specificity `:where()`; the legacy `* { margin: 0 }` reset in the same layer won | Duplicate reset removed (preflight already does it) |
| `.text-body` line-height 24 → 24.375 px | Legacy `@utility text-body { leading-relaxed }` now beats the `--text-body` token | Utility trimmed to color only |
| `leading-none` / `tracking-tight` now override `md:text-display` / `md:text-h1` | v4 font-size utilities read `--tw-leading` / `--tw-tracking`, so explicit leading wins at every breakpoint | Added `md:leading-(--text-*--line-height)` / `md:tracking-(…)` in Footer, CaseMetric, CaseNextLink, CasePullquote |

**Follow-up noted:** the `Dockerfile` builds on `node:20-alpine` (Node 20 reached end of life in April 2026). Bump it to `node:22-alpine` or `node:24-alpine` in the Phase 6 deploy step.

### Phase 1b — Semantic token migration + Voltage theme (1.5 days)
- [ ] Define the §3.1 tokens in `@theme` (OKLCH), plus `light-dark()` pairs for §3.2.
- [ ] Codemod the **26 files** using `ink-*`/`paper-*`/`brand-*` to the semantic names: `bg-ink-900` → `bg-canvas`, `bg-ink-800` → `bg-surface`, `text-paper-50/100` → `text-fg`, `text-paper-200/300` → `text-fg-muted`, `text-paper-400` → `text-fg-subtle`, `text-brand-400` → `text-accent-ink`, `border-ink-6xx/7xx` → `border-line`, `bg-brand-*` → `bg-accent`. Drop the legacy `.heading-*`, `.card*`, `.glass`, and duplicate `.text-body`.
- [ ] Fonts: add Space Grotesk, remove Instrument Serif. Replace every `font-serif italic` accent with `<Highlight>`.
- [ ] `layout.tsx`: `theme-color #F2EFE8`, `color-scheme: light`, selection + focus-ring tokens.
- [ ] Re-theme hardcoded assets: `api/og/route.tsx` (paper background, black type, orange chip), and the `public/work/*.svg` covers (orange/black on paper instead of indigo glow).
- [ ] Remove `HeroCanvas` and three/r3f/drei. The old hero temporarily sits on plain `canvas`.
- **Exit:** every route renders legibly in Voltage colors, and axe shows no contrast failures. Layouts are still the old ones.

### Phase 2 — Primitives & motion system (1.5 days)
- [ ] `ui/`: `Bento` (12-col grid, container-query aware), `Tile` (white/sunk/accent/inverse variants, lift + glow hooks), `Button` (black pill / outline pill / link), `Chip`, `Highlight` (orange wipe chip), `Stat` (`@property` counter), `Eyebrow`, `Marquee`.
- [ ] `styles/motion.css`: `.reveal`, `.tile-in` (with `--i` stagger), `.highlight-wipe`, `.progress-x`, and header condense, all `view()`/`scroll()` behind `@supports`, with an `IntersectionObserver` fallback that adds `.in-view`.
- [ ] `SplitText` becomes a server component (words carry `--i` and are visible without JS). The animation only runs when `html.js-motion` is set by an inline head script.
- [ ] Islands: `TileGlow`, `MagneticCTA` (a spring port of `Magnetic`), `ChennaiClock`.
- [ ] Rebuild `/playground` to catalogue the primitives on Voltage tokens.

### Phase 3 — Section rebuilds per §4 (3 days, one PR per section)
- [ ] Header (popover menu, condense, hide-on-scroll via IO sentinel, `aria-current`).
- [ ] Hero bento (the H1 is server-rendered and visible, which makes it the LCP element; the stat and status values come from `data/site.ts`).
- [ ] Selected Work bento + `<ViewTransition>` cover morph + metric chip.
- [ ] Trust strip (marquee or stat tiles, gated on `logos.filter(l => l.approved).length >= 4`).
- [ ] Capabilities 2×2 bento, with data moved to `data/capabilities.ts`.
- [ ] Process inverse section with a horizontal track and `view()` progress bar, with data moved to `data/process.ts`.
- [ ] Conversation orange band and `ContactForm` island: shared Zod schema, inline `aria-describedby` errors, budget and timeline pill radio groups, honeypot, `useFormStatus`, `useOptimistic` success.
- [ ] Footer with the clipped wordmark; fix or remove the `/legal/*` links.

### Phase 4 — Server action & backend hardening (0.5 day)
- [ ] `app/actions/contact.ts`:
  - Zod parse → honeypot reject → token-bucket rate limit keyed by IP. It's in memory for now; use Redis/Upstash if Dokploy runs >1 replica.
  - `escapeHtml` on every interpolated value, and a plain-text body alongside the HTML.
  - Budget and timeline included in the email.
- [ ] Keep `/api/contact` as a thin wrapper over the same function, or delete it if nothing external uses it.
- [ ] Confirm `backups/` (which contains `lead.json`) is git-ignored and excluded by `.dockerignore`.

### Phase 5 — Responsive, a11y & performance pass (1.5 days)
- [ ] Bento breakpoint audit at 360, 390, 768, 1024, 1280, 1440, 1920, and landscape phone. No horizontal scroll, tap targets ≥ 44 px, and tile content never clips at 200% zoom.
- [ ] `svh` for above-the-fold sizing; `safe-area-inset` on the header and footer.
- [ ] WCAG 2.2 AA:
  - Verify every §3.1 pair with a script (`culori` in a test) so contrast is checked in CI.
  - Enforce the accent rules.
  - Skip link, visible focus on every tile link.
  - Marquee duplicates set to `aria-hidden`.
  - Clock tile gets `aria-live="off"`.
- [ ] `prefers-reduced-motion` and `prefers-reduced-transparency` (no grain, no blur) variants.
- [ ] Lighthouse CI budgets:
  - LCP < 1.5 s (mobile 4G)
  - INP < 150 ms
  - CLS < 0.02
  - **home JS < 80 KB gz** (measured **503 KB** in Phase 0; three.js + r3f alone is 229 KB and currently downloads on mobile too)
  - Lighthouse ≥ 95 mobile / 100 desktop
- [ ] Preload only Space Grotesk 700 and Geist 400 latin subsets.

### Phase 6 — Verify & ship (0.5 day)
- [ ] Review Playwright visual diffs and accept the new baselines. Axe must show zero serious or critical issues.
- [ ] Cross-browser: Chrome, Safari 18+, Firefox (the scroll-timeline fallback path), iOS Safari, and Android Chrome.
- [ ] Update the `README.md` design-system section (palette, type, motion) and mark the 2026-04-28 spec's R1 visuals as superseded.
- [ ] Deploy to Dokploy staging, then production.

**Total estimate:** ~10 working days for one engineer (+1 day vs v1 for the token migration and re-theming the other routes and assets).

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Orange accent misused as small text and failing contrast | Separate `accent` (fill) and `accent-ink` (text) tokens, plus a CI contrast test over the token pairs |
| Dark → light flip breaks `/work`, `/studio`, and `/journal` | Phase 1b migrates all 26 files before any layout work; Phase 0 screenshots cover every route |
| Bento layouts break at in-between widths | Container queries on `Tile`, with explicit layouts at 3 container sizes rather than viewport breakpoints; Playwright at 7 widths |
| Tailwind v4 default changes (border color, ring width) | Run the upgrade tool in Phase 1a while still on the dark theme and diff in isolation |
| Scroll-driven animations unsupported in older Firefox/Safari | `@supports` gate + IO fallback; final states are the defaults |
| React `<ViewTransition>` still experimental | Wrapped in our own `<CaseMorph>` with the existing `ViewTransitionLink` as a one-line fallback |
| Voltage reads as generic "startup light" | The signature moments in §3.5 (highlight wipe, live clock/booking tiles, orange band close, clipped wordmark) are mandatory, not polish-phase extras |

---

## 8. Open questions (need a decision before Phase 3)

1. **Q1 — Logos:** are any real, approved client logos available? If not, ship the stat-tile trust strip.
2. **Q2 — Budget chips in the form:** OK to ask for budget ranges ($15–30k / $30–60k / $60k+) and a timeline?
3. **Q3 — Dark variant:** ship an auto dark mode (`prefers-color-scheme`) with a toggle, or stay light-only for launch? The recommendation is **light-only at launch**, with tokens ready.
4. **Q4 — Booking tile:** OK to show a "2 slots in Oct"–style availability number, and who updates it (`data/site.ts` for now)?
5. **Q5 — CMS:** keep the data modules as TS files for now (recommended), or write them directly as Sanity schemas?

---

## 9. Definition of done

- Home keeps the same six-section narrative and copy, presented in Voltage as specified in §3–§4.
- Every route is legible on the new tokens, and there are no `ink-*`/`paper-*`/`brand-*` references left in `src/`.
- There are ≤ 6 client components on `/`, the home JS budget is met, and three.js and GSAP are gone.
- The H1 is visible with JS disabled, and the contact form submits with JS disabled.
- All Phase 5 budgets pass in CI, axe is clean, the contrast test is green, and reduced motion has been verified.
- The contact endpoint is hardened: escaped, validated, rate-limited, and with no credential fallback.
