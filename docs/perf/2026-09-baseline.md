# Phase 0 Baseline — 2026-09-28

The "before" snapshot for the [landing page modernization plan](../superpowers/plans/2026-09-28-landing-page-modernization.md). Every later phase is measured against these numbers.

**Build:** `development` @ `d9ced77` + Phase 0 hotfixes · Next 16.2.4 (Turbopack) · production build (`next build` → `next start`)
**Machine:** local macOS, Apple Silicon. Lighthouse uses its default mobile emulation (Moto G Power, slow 4G, 4× CPU throttle) and `--preset=desktop`. These are single runs, so expect ±5 points of variance on the performance score.

> **Note:** the home page captured here already has the logo wall hidden (Phase 0 hotfix). Everything else is the untouched dark Plasma Indigo site.

---

## Lighthouse (v12)

| Run | Perf | A11y | Best pr. | SEO | LCP | TBT | CLS | FCP | LCP element |
|---|---|---|---|---|---|---|---|---|---|
| Mobile `/` | **70** | 96 | 100 | 100 | **5.5 s** | 340 ms | 0 | 1.0 s | Case-cover `<img>` in Selected Work |
| Mobile `/work/fintech-marketing-rebuild` | 88 | 94 | 100 | 100 | 3.7 s | 70 ms | 0 | 0.8 s | Case H1 |
| Desktop `/` | 90 | 96 | 100 | 100 | 0.5 s | 260 ms | 0.012 | 0.3 s | Hero H1 (`SplitText` span) |
| Desktop `/work/fintech-marketing-rebuild` | 100 | 94 | 100 | 100 | 0.8 s | 0 ms | 0 | 0.2 s | Case-cover `<img>` |

**Mobile `/` diagnostics:**
- 253 KiB of unused JavaScript
- 1.2 s JS boot-up and 2.9 s main-thread work
- LCP breakdown: TTFB 462 ms · load delay **2 557 ms** · load time 103 ms · render delay **2 411 ms**

The hero H1 is masked by JS (`y: 110%`), so on a throttled phone it isn't painted in time to count as the LCP element, and LCP falls to a lazily loaded case cover further down.

**Targets (plan §6, Phase 5):** LCP < 1.5 s mobile · INP < 150 ms · CLS < 0.02 · Lighthouse ≥ 95 mobile / 100 desktop.

---

## JavaScript weight per route

Measured with Playwright: every `script` response after load plus a full scroll, gzipped at level 6.

| Route | Files | Raw | **Gzip** |
|---|---|---|---|
| `/` (desktop **and** mobile) | 15 | 1 734 KB | **503 KB** |
| `/work`, `/work/[slug]`, `/studio`, `/journal` | 14 | 869 KB | 274 KB |

**The largest home-only chunk is three.js + @react-three/fiber, at 229 KB gzipped.** It downloads **on mobile too**. `HeroCanvas` checks screen size (≤ 640 px), reduced motion and core count *inside* the dynamically imported module, so the bundle is fetched before those checks can skip it. The shared framework + motion + Lenis/GSAP baseline is ~274 KB on every route.

**Target (plan §6, Phase 5):** home JS < 80 KB gzipped.

---

## Accessibility (axe-core, WCAG 2.0/2.1/2.2 A + AA)

`reducedMotion: reduce`, at 375 px and 1280 px. Raw output: [`2026-09-baseline/axe.json`](2026-09-baseline/axe.json).

| Route | 375 px | 1280 px |
|---|---|---|
| `/` | color-contrast × 50 | color-contrast × 53 |
| `/work` | color-contrast × 18 | color-contrast × 19 |
| `/work/[slug]` | color-contrast × 23 | color-contrast × 24 |
| `/studio` | color-contrast × 17 | color-contrast × 18 |
| `/journal` | color-contrast × 15 | color-contrast × 16 |

**The only violation type is `color-contrast` (serious).** Offenders are `text-paper-400` (`#6b6c8a`, ≈ 3.9:1 on `#0a0a0c`) mono labels, anchor strips, eyebrows, and `text-brand-600` accents. The Voltage token set (plan §3.1) replaces all of these with pairs ≥ 4.5:1.

---

## Screenshots

There are 40 full-page PNGs: 5 routes × 375 / 768 / 1280 / 1920 px × motion / reduced-motion.

They live in `docs/perf/2026-09-baseline/screenshots/`, which is **git-ignored** (17 MB). Regenerate them from a production build with:

```bash
npm run baseline:screens
```

---

## How to reproduce

```bash
npx next build
npm run baseline:screens   # screenshots (starts `next start -p 3100` automatically)
npm run baseline:a11y      # writes docs/perf/2026-09-baseline/axe.json
npx lighthouse@12 http://localhost:3100/ --quiet --output=json --output-path=lh-mobile-home.json
npx lighthouse@12 http://localhost:3100/ --preset=desktop --quiet --output=json --output-path=lh-desktop-home.json
```

---

## Phase 0 hotfixes shipped with this baseline

| Change | File |
|---|---|
| Contact route escapes every user value before it goes into the email HTML, strips CR/LF from the subject, and sets `replyTo` | `src/app/api/contact/route.ts`, `src/lib/escape-html.ts` |
| Contact route **fails closed** with 503 when `EMAIL_USER`/`EMAIL_PASS` are missing (no placeholder-credential fallback) | `src/app/api/contact/route.ts` |
| Contact route rejects non-JSON and non-string fields with 400 (previously crashed with 500), enforces length caps, and includes the `project` field in the email | `src/app/api/contact/route.ts` |
| Placeholder third-party logo names are hidden in production. Logos need `approved: true`; the section renders nothing when none are approved. | `src/components/sections/LogoWall.tsx` |
| `backups/` (lead export data) and Playwright artifacts are git-ignored | `.gitignore` |
