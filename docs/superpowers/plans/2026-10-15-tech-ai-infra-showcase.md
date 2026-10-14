# Technology, AI & Infrastructure Showcase — Plan

**Date:** 2026-10-15
**Status:** ✅ Implemented 2026-10-15 (Option A, all §8 recommendations accepted)
**Source brief:** user-supplied prompt "Landing Page Enhancement: Technology, AI & Infrastructure Showcase", adapted to the shipped Voltage design ([modernization plan](2026-09-28-landing-page-modernization.md)).

---

## 1. What exists today (research)

| Area | Current state | Relevance |
|---|---|---|
| Home order | Hero → Selected Work → **Trust strip** → **Capabilities** → Process → Conversation → Footer | Six sections; adding a seventh lengthens an already full page |
| Trust strip | 3 stat tiles (Lighthouse 95+, 2–4 wk, Chennai →). Switches to a logo marquee once ≥ 4 *client* logos are approved | A tech marquee here would compete with the future client-logo marquee — two marquees of logos would read as the same thing |
| Capabilities | 2×2 bento: Web · Mobile · AI integration · Performance, each with stack chips (Next.js, SwiftUI, React Native, Expo, OpenAI, RAG…) and a proof line | **Already half of the brief.** The brief's "AI & Intelligent Solutions" overlaps the AI tile; "Cloud/VPS" is new; languages/frameworks are partially listed as chips |
| `ui/Marquee` | CSS-only loop, duplicate copy is `aria-hidden` + `inert`, pauses on hover/focus, edge fade mask, static wrapped row under reduced motion | Satisfies every motion/a11y requirement in the brief — reuse, don't rebuild |
| Budgets (Lighthouse CI) | perf ≥ 95, CLS ≤ 0.02, LCP ≤ 1.5 s, scripts ≤ 200 KB (home 187 KB) | The showcase must add **zero JS** — inline SVG + CSS only |
| Logo source | Simple Icons 16.35 (CC0): rust, javascript, typescript, react, nextdotjs, flutter, android, ios, claude, cursor, replit ✔ — **openai ✘** (removed at OpenAI's request) | "OpenAI Codex" needs OpenAI's official mark under their brand guidelines, or a text label |

**Key observation:** the brief describes two different things — **tools we use** (languages, frameworks, AI dev tools) and **services we sell** (AI solutions, cloud/VPS/infra). On this page, "services we sell" already has a home: Capabilities. Treating the brief as a brand-new standalone section would duplicate Capabilities and stack a second logo strip next to the trust strip.

---

## 2. Design principles for this addition (Voltage-specific)

1. **Logos are monochrome** (`fg-muted`, → `fg` on hover). Brand-coloured logos would fight the single-orange-accent rule and look like a sticker sheet. Colour only appears via the existing orange accents (category labels, chips).
2. **One motion element per viewport.** The hero already animates (counters, wipe); the marquee lives where nothing else moves.
3. **Tools scroll, services don't.** Technologies/AI tools are recognisable marks → a marquee. Services are sentences → tiles with lists (scannable, linkable, readable when paused).
4. **Bento grammar, no new visual vocabulary.** Reuse `Tile`, `Chip`, `Eyebrow`, `Marquee`, `Highlight`. No new card style.
5. **Category is visible without motion.** Each logo carries a text label; categories are separated by mono labels (`LANGUAGES ·`, `AI TOOLS ·`), so a paused or reduced-motion strip still explains itself.

---

## 3. Layout options

### Option A — "Stack strip + services in Capabilities" ★ Recommended

No new section. Two changes:

```
 HERO (bento)
 ─────────────────────────────────────────────────────────────────────
 STACK STRIP  (replaces the stat-tile trust strip until client logos exist)
 ◂ LANGUAGES · [Rust] [JS] [TS] · WEB · [React] [Next.js] · MOBILE ·
   [Flutter] [React Native] [Android] [iOS] · AI TOOLS · [Claude Code]
   [Cursor] [Replit] [Codex] · LANGUAGES · …                         ▸
 ─────────────────────────────────────────────────────────────────────
 SELECTED WORK
 ─────────────────────────────────────────────────────────────────────
 02 CAPABILITIES — "What we ship, end to end."   (2×2 → 3×2 bento)
 ┌──────────────┬──────────────┬──────────────┐
 │ 01 Web       │ 02 Mobile    │ 03 AI apps & │
 │ React·Next   │ Flutter·RN·  │    agents    │
 │              │ Android·iOS  │ LLM·RAG·docs │
 ├──────────────┼──────────────┼──────────────┤
 │ 04 Perf &    │ 05 Cloud &   │ 06 AI-native │
 │    rebuilds  │    infra ▣   │    delivery  │
 │              │ VPS·CI/CD·…  │ Claude Code… │
 └──────────────┴──────────────┴──────────────┘   ▣ = inverse tile
```

- The strip moves **directly under the hero** (the brief's own placement) and replaces the stat tiles; the stats move into the hero/Capabilities copy where they already appear. When ≥ 4 client logos are approved, the client marquee takes this slot and the stack strip moves to the top of Capabilities (one logo strip on the page at any time).
- Capabilities grows to six tiles: the brief's **AI & Intelligent Solutions** becomes "AI apps & agents" (merging today's AI tile), **Cloud, VPS & Infrastructure** becomes a new inverse tile with the service list, and a new **"AI-native delivery"** tile explains *how* Claude Code / Cursor / Replit / Codex make 2–4-week delivery possible (turns tool logos into a business claim).
- **Page length:** +~1 row of tiles. **Sections:** still six. **JS:** 0.
- **Why:** answers the whole brief with the least new surface, removes the services/technology overlap, and keeps one marquee.

### Option B — "Ecosystem band" (the brief's 3-row idea, adapted)

A new section between Selected Work and Capabilities:

```
 03 STACK — "Engineering, AI and cloud — one studio."
 Row 1  ◂ [Rust][JS][TS][React][Next.js][Flutter][RN][Android][iOS] ◂   (marquee →left)
 Row 2    [Claude Code] [Cursor] [Replit] [Codex]                       (static chips, centred)
 Row 3  ┌ AI solutions ────────────┐ ┌ Cloud & infrastructure ──────┐  (2 tiles)
        │ LLM · agents · RAG · docs│ │ VPS · private cloud · CI/CD  │
        └──────────────────────────┘ └──────────────────────────────┘
```

- Row 2 is **static**, not a second marquee: four items can't loop without visible repetition, and two opposite-direction strips add clutter the brief itself warns against.
- **Cost:** a seventh section, and Row 3 overlaps Capabilities' AI tile unless Capabilities is trimmed (which pushes the work into two sections).
- **Pick this if** you want the stack to be its own clearly labelled destination (e.g. linkable `/#stack` for proposals).

### Option C — "Ecosystem bento" (static, no motion)

```
 03 STACK
 ┌ Languages & web ────────┬ Mobile ─────────┬ AI dev tools ───────┐
 │ [Rust][JS][TS]          │ [Flutter][RN]   │ [Claude][Cursor]    │
 │ [React][Next.js]        │ [Android][iOS]  │ [Replit][Codex]     │
 ├ AI solutions (inverse) ─┴─────────────────┼ Cloud & infra ──────┤
 │ 6 services, 2 columns                     │ 7 services          │
 └───────────────────────────────────────────┴─────────────────────┘
```

- Logo grids inside tiles; nothing moves. Best scannability and the calmest page; strongest on print/PDF-like reading.
- **Cost:** the heaviest section (~1 viewport); still overlaps Capabilities.
- **Pick this if** motion should stay with the hero only, or the audience is procurement-style readers who scan lists.

### Option D — "Inverse dual marquee" (considered, not recommended)

Full-bleed black band, two marquees in opposite directions. Rejected: Voltage allows **one** inverse section (Process) — a second black band breaks the page rhythm, and two moving rows near the hero compete with the primary CTA.

### Comparison

| | A · Strip + Capabilities | B · Ecosystem band | C · Static bento | D · Dual marquee |
|---|---|---|---|---|
| New sections | 0 | 1 | 1 | 1 |
| Moving rows | 1 | 1 | 0 | 2 |
| Overlap with Capabilities | none (merged) | partial | partial | partial |
| Page length added | ~0.4 viewport | ~1 | ~1 | ~0.6 |
| Fits Voltage rules | ✔ | ✔ | ✔ | ✘ (2nd inverse band) |
| Client-logo strip later | swaps in cleanly | 2 logo strips | 2 logo areas | 3 strips |

---

## 4. Component design (applies to A and B; C reuses the logo + chip pieces)

- **`data/stack.ts`** — single source of truth: `{ id, label, category, logo: IconKey | null }` for technologies/tools; `{ title, items[], proof? }` for service groups. Categories: `languages · web · mobile · ai-tools`.
- **`ui/TechLogo.tsx`** (server) — inline SVG path from a local `icons/brand/*.ts` map (paths copied from Simple Icons, CC0, with slug + version noted), `fill="currentColor"`, fixed 24 px box, label beside it in Geist (text-step-0). No runtime dependency; ~0.5–1.5 KB per logo in HTML.
- **`sections/StackStrip.tsx`** (server) — `Marquee` with grouped items: a mono category label (`text-accent-ink`) precedes each group; groups separated by a hairline. `durationS` tuned so the strip moves ~30–40 px/s.
- **Capabilities** — `data/capabilities.ts` grows to six entries; add optional `services: string[]` rendered as a two-column list; one tile `tone="inverse"`.
- **No new dependency** (Simple Icons paths are vendored as data, not installed).

**Motion & a11y (already provided by `Marquee`, re-verified):** transform-only loop; duplicate group `aria-hidden` + `inert`; pause on hover and keyboard focus; edge mask; `prefers-reduced-motion` → static wrapped rows with no duplicate; touch: CSS animation doesn't capture pointer events, so vertical scroll is untouched. The list has an accessible name ("Technologies and tools we use").

---

## 5. Phases

| # | Step | Size | Files | Verification |
|---|---|---|---|---|
| 1 | **Logo sourcing & licensing** — vendor Simple Icons paths for the 11 available marks; obtain Codex mark from OpenAI's brand kit *or* use text label (per Q4); record provenance | S | `src/components/icons/brand/*.ts`, `docs/brand/logo-sources.md` | Every mark renders at 24 px in `/playground`; provenance file lists source, licence, version |
| 2 | **`data/stack.ts` + `TechLogo`** | S | `src/data/stack.ts`, `src/components/ui/TechLogo.tsx` | `tsc`, lint; playground row of all logos, light + dark tile |
| 3 | **Stack strip** (Option A/B) | S | `src/components/sections/StackStrip.tsx`, `src/app/page.tsx`, `TrustStrip.tsx` (slot logic) | Breakpoint audit (10 sizes, 0 overflow); reduced-motion screenshot shows static wrapped rows; hover/focus pauses (Playwright `animationPlayState`) |
| 4 | **Capabilities 3×2** — AI apps & agents, Cloud & infra (inverse), AI-native delivery | M | `src/data/capabilities.ts`, `src/components/sections/Capabilities.tsx` | Visual review at 375/768/1280; heading order; copy approved |
| 5 | **Quality gates** | S | — | `npm run test:unit` (contrast unchanged), axe incl. best-practice = 0, `npm run lhci` all budgets pass (scripts still ≤ 200 KB, CLS ≤ 0.02), cross-browser (Chromium/WebKit/Firefox) |
| 6 | **Docs** — README primitives, plan progress, Assets guide note on third-party marks | XS | `README.md`, this plan | — |

Highest-risk step first: **Phase 1** (a logo we can't legally or visually use changes the content of every later step).

---

## 6. Decision log (proposed — confirm in §8)

| # | Decision | Proposed | Why |
|---|---|---|---|
| D1 | Layout | **Option A** | No duplicate content, no new section, one marquee, fits Voltage rules |
| D2 | Logo colour | Monochrome `fg-muted` → `fg` on hover | Single-accent rule; consistent weight across very different brand marks |
| D3 | AI dev tools presentation | In the strip **and** explained in an "AI-native delivery" tile | Logos alone are decoration; the tile turns them into a delivery-speed claim |
| D4 | Services presentation | Tiles with lists, never in the marquee | Sentences don't read while moving; services must be scannable |
| D5 | Logo source | Vendored Simple Icons paths (CC0), no npm dependency | Zero JS, consistent geometry, licence recorded |
| D6 | Codex | Text label unless OpenAI's brand kit is used per its guidelines | Not available in Simple Icons by OpenAI's request |

## 7. Always / Never

**Always:** zero added client JS · reuse `Marquee`/`Tile`/`Chip`/`Eyebrow` · every logo has a visible text label · content readable with animation off · third-party marks shown factually ("tools we use"), never implying partnership or endorsement · all budgets in `lighthouserc.json` stay green.

**Never:** brand-coloured logo walls · a second inverse band · more than one moving strip on the page · logos without licence/provenance · claims of skills or services the studio doesn't actually deliver.

## 8. Questions (each with a recommendation)

1. **Layout?** → **A** (strip + expanded Capabilities). B if you want a linkable standalone "Stack" section; C if no motion beyond the hero.
2. **Is every listed item a real, current capability?** The brief adds **Rust, Flutter, native Android/iOS, VPS / private cloud, DNS/SSL, monitoring/backups/hardening** — today's site lists SwiftUI/React Native/Expo and no infra services. → Recommend listing only what you'd staff a project on this month; tell me any to drop.
3. **Keep SwiftUI and Expo** (currently on the site) alongside Flutter? → Yes for SwiftUI (iOS native), drop Expo into the React Native line.
4. **OpenAI Codex logo** → Text label "Codex" with no mark (safest); or you supply OpenAI's official asset and we follow their guidelines.
5. **Section/heading copy** → Strip label: "Built with" (mono eyebrow, no headline — it's a strip). New tiles: "AI apps & agents", "Cloud & infrastructure", "AI-native delivery". Brief's headline options ("Technology That Powers Innovation" etc.) only needed for B/C; recommend **"Engineering, AI and cloud — one studio."** if so.
6. **Trust-strip stats** (Lighthouse 95+, 2–4 wk, Chennai) → fold into Capabilities proof lines and hero (already shown there) when the strip takes the slot.

**Assumptions (correct me or I proceed):** 1) home page only, no new route; 2) light theme only (no dark mode work); 3) English only; 4) no CMS wiring; 5) logos link nowhere (no outbound vendor links); 6) the client-logo marquee rule from Phase 3 stays (≥ 4 approved logos).

**Out of scope:** a dedicated `/stack` page, technology detail pages, pricing for infra services, vendor partnership badges, client logos, dark mode.

## 9. Progress

| Phase | Status |
|---|---|
| Plan | ✅ approved 2026-10-15 — "go with these recommendations" (A · all items listed · SwiftUI kept, Expo folded · Codex as text · proposed copy · stats dropped) |
| 1 Logo sourcing | ✅ 11 Simple Icons marks vendored in `src/components/icons/brand.ts`; provenance + guidelines links in `docs/brand/logo-sources.md` |
| 2 Data + `TechLogo` | ✅ `src/data/stack.ts`, `src/components/ui/TechLogo.tsx` |
| 3 Stack strip | ✅ `StackStrip`/`StackBand` under the hero; `TrustStrip` now client-logos-only and swaps into this slot at ≥ 4 approved logos (strip then moves into Capabilities) |
| 4 Capabilities 3×2 | ✅ AI apps & agents (6 services) · Cloud & infrastructure (inverse, 7 services) · AI-native delivery; `on-inverse` chip tone |
| 5 Quality gates | ✅ see below |
| 6 Docs | ✅ README, this record |

### Deviations found during execution
- **D7 · iOS uses a generic phone glyph.** Simple Icons' `ios` mark is just the word "iOS" (rendered "iOS iOS"), and Apple's guidelines don't permit third-party use of the Apple logo. Same treatment as Codex.
- **D8 · Pause control added to `Marquee` (WCAG 2.2.2, Level A).** Hover-only pause excluded keyboard and touch users (the strip has no focusable items, so `:focus-within` never fires). A visually-hidden checkbox in a 44 px round label pauses via CSS `:has()` — works without JS, hidden under reduced motion. Benefits the future client-logo marquee too.
- **Copy to confirm before launch:** the "AI-native delivery" proof line ("Engineers own the architecture and review every AI-assisted change before merge") and the new services lists are claims about how the studio works — verify they're true as written.

### Verification evidence
- Strip: moves ≈ 23–38 px/s; pause by **toggle** (keyboard Space, click, and **no-JS click**) → 0 px movement, resumes on second press; pause on **hover** → 0 px; focus ring visible; toggle 44×44. Reduced motion: no animation, duplicate hidden, wrapped row, toggle hidden.
- A11y structure: "Built with" heading, list "Technologies and tools we use" (18 items), duplicate `aria-hidden` + `inert`, all marks `aria-hidden` with visible labels. axe (WCAG 2.2 AA + best-practice): **0 violations on all routes**.
- No horizontal overflow on 6 routes × 7 widths (320–1920). No console errors.
- Cross-browser: Chromium 153, WebKit 26.6, Firefox 155 — moving, toggle pause, hover pause, 6 tiles, 0 overflow, 0 errors.
- Lighthouse CI (DevTools throttling, median of 3): all budgets pass. Home perf 100, LCP 0.88–0.97 s, TBT 30–45 ms, CLS 0.001, **JS unchanged at 167 KB**; HTML 57 → 75 KB transferred (inline marks + new tiles). Case page perf 100, LCP median 1.34 s.
- `npm run test:unit` 43/43.
