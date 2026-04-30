# Admin Text-Logo Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins choose, per site, whether the header wordmark is an uploaded image or typeset text with font / size / weight / letter-spacing controls — with image mode preserved as the default so the live site is unchanged on day 1.

**Architecture:** Extend `siteSettings` with six new attributes; centralize the 10-font allowlist in `src/app/fonts.ts` and a derived `FONT_OPTIONS` map; render via a new server `<Wordmark>` component; edit via a new client `<LogoFieldset>` component that appears as a single `'logo-mode'` field in the existing admin form pipeline. The `saveDocument` server action is extended to extract the umbrella field's sub-keys from FormData.

**Tech Stack:** Next.js 16 App Router, Appwrite Cloud, `next/font/google`, React 19, TypeScript strict.

---

### Repo notes (read before starting)

- This repo has **no test framework** wired up (`package.json` scripts: `dev`, `build`, `lint`, `appwrite:bootstrap`, `appwrite:migrate-content`, `appwrite:migrate-blocks`, `appwrite:backup`). Verification is via:
  - `npm run lint`
  - `npm run build`
  - `node scripts/qa-crud-probe.mjs`
  - manual `npm run dev` smoke test against `/admin/siteSettings/_singleton` and `/`
- The header wordmark today is **inline JSX text** (`HeaderClient.tsx` lines 48–54), not an image. The new `<Wordmark>` component replaces that inline JSX; it also handles the image branch using the existing (already-defined-but-not-yet-used) `wordmarkFileId`.
- The Appwrite singleton document ID for `siteSettings` is the literal string `"siteSettings"` (see `src/lib/cms/site-settings.ts` `getDocument(..., 'siteSettings', 'siteSettings')`).
- The `coerce()` helper in `actions.ts` iterates `cfg.fields`. For umbrella field types (like `'logo-mode'`) we extract sub-keys via a switch arm rather than relying on the per-field loop.

---

## Task 1: Add the six new attributes to `appwrite.json`

**Files:**
- Modify: `appwrite.json` — `siteSettings` collection's `attributes` array

- [ ] **Step 1: Add the attributes**

In `appwrite.json`, inside the `siteSettings` collection's `attributes` array (immediately after the existing `heroAnchorCenter` entry around line 59), add:

```json
,
{ "key": "logoMode",          "type": "string",  "size": 8,  "required": false,
  "_comment": "Enum-like: image | text. Defaults to image at the renderer." },
{ "key": "logoText",          "type": "string",  "size": 64, "required": false },
{ "key": "logoFontFamily",    "type": "string",  "size": 32, "required": false,
  "_comment": "Allowlist key — see src/app/fonts.ts FONT_OPTIONS." },
{ "key": "logoFontSize",      "type": "integer", "required": false, "min": 12, "max": 48 },
{ "key": "logoFontWeight",    "type": "integer", "required": false, "min": 100, "max": 900 },
{ "key": "logoLetterSpacing", "type": "string",  "size": 16, "required": false }
```

- [ ] **Step 2: Run the bootstrap script**

Run: `npm run appwrite:bootstrap`
Expected: `+ siteSettings.logoMode` (and the other 5 keys) under "Attributes". On a re-run it should print `· skip siteSettings.logoMode (exists)`.

- [ ] **Step 3: Commit**

```bash
git add appwrite.json
git commit -m "feat(schema): add 6 logo-mode attributes to siteSettings"
```

---

## Task 2: Create the font allowlist module

**Files:**
- Create: `src/app/fonts.ts`
- Modify: `src/app/layout.tsx` lines 3, 14–35

- [ ] **Step 1: Create `src/app/fonts.ts`**

```ts
/**
 * Font registry. Single source of truth for the typography choices
 * available across the site and the admin "logo as text" picker.
 *
 * The 3 brand fonts (Geist / Geist Mono / Instrument Serif) are
 * preloaded — they back body, display, and mono everywhere.
 *
 * The 7 curated fonts are loaded with `preload: false` and `display:
 * 'swap'` so they only ship when an editor opts into them via the
 * logo picker. Subset is `latin` to keep payload small.
 */
import {
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Inter,
  Manrope,
  Playfair_Display,
  DM_Serif_Display,
  Space_Grotesk,
  Fraunces,
  JetBrains_Mono,
} from 'next/font/google';

export const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
  preload: true,
});

export const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: true,
});

export const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  preload: true,
});

const inter            = Inter({            subsets: ['latin'], display: 'swap', preload: false });
const manrope          = Manrope({          subsets: ['latin'], display: 'swap', preload: false });
const playfair         = Playfair_Display({ subsets: ['latin'], display: 'swap', preload: false });
const dmSerifDisplay   = DM_Serif_Display({ subsets: ['latin'], weight: '400', display: 'swap', preload: false });
const spaceGrotesk     = Space_Grotesk({    subsets: ['latin'], display: 'swap', preload: false });
const fraunces         = Fraunces({         subsets: ['latin'], display: 'swap', preload: false });
const jetbrainsMono    = JetBrains_Mono({   subsets: ['latin'], display: 'swap', preload: false });

export type FontKey =
  | 'geist'
  | 'geist-mono'
  | 'instrument-serif'
  | 'inter'
  | 'manrope'
  | 'playfair'
  | 'dm-serif-display'
  | 'space-grotesk'
  | 'fraunces'
  | 'jetbrains-mono';

export type FontOption = {
  key: FontKey;
  label: string;
  className: string;
  /** Used for the live preview's `style.fontFamily` only (className already loads the font). */
  family: string;
};

export const FONT_OPTIONS: Record<FontKey, FontOption> = {
  'geist':            { key: 'geist',            label: 'Geist (brand)',           className: geist.className,            family: 'Geist, sans-serif' },
  'geist-mono':       { key: 'geist-mono',       label: 'Geist Mono (brand)',      className: geistMono.className,        family: '"Geist Mono", monospace' },
  'instrument-serif': { key: 'instrument-serif', label: 'Instrument Serif (brand)', className: instrumentSerif.className,  family: '"Instrument Serif", serif' },
  'inter':            { key: 'inter',            label: 'Inter',                   className: inter.className,            family: 'Inter, sans-serif' },
  'manrope':          { key: 'manrope',          label: 'Manrope',                 className: manrope.className,          family: 'Manrope, sans-serif' },
  'playfair':         { key: 'playfair',         label: 'Playfair Display',        className: playfair.className,         family: '"Playfair Display", serif' },
  'dm-serif-display': { key: 'dm-serif-display', label: 'DM Serif Display',        className: dmSerifDisplay.className,    family: '"DM Serif Display", serif' },
  'space-grotesk':    { key: 'space-grotesk',    label: 'Space Grotesk',           className: spaceGrotesk.className,      family: '"Space Grotesk", sans-serif' },
  'fraunces':         { key: 'fraunces',         label: 'Fraunces',                className: fraunces.className,          family: 'Fraunces, serif' },
  'jetbrains-mono':   { key: 'jetbrains-mono',   label: 'JetBrains Mono',          className: jetbrainsMono.className,     family: '"JetBrains Mono", monospace' },
};

/** Defaults applied when a logo field is missing on the document. */
export const LOGO_DEFAULTS = {
  mode: 'image' as 'image' | 'text',
  text: 'Codeminds Digital',
  fontFamily: 'geist' as FontKey,
  fontSize: 20,
  fontWeight: 500,
  letterSpacing: '-0.01em',
};

export const LETTER_SPACING_PATTERN = '^-?\\d*\\.?\\d+(em|px|rem)$|^normal$';

export function resolveFont(key: string | null | undefined): FontOption {
  if (key && key in FONT_OPTIONS) return FONT_OPTIONS[key as FontKey];
  return FONT_OPTIONS[LOGO_DEFAULTS.fontFamily];
}
```

- [ ] **Step 2: Refactor `src/app/layout.tsx` to import from fonts.ts**

Replace the import on line 3 and the three font instances on lines 14–35 with:

```ts
import { geist, geistMono, instrumentSerif } from './fonts';
```

(Delete the local `const geist = …`, `const geistMono = …`, `const instrumentSerif = …` blocks. Keep all other imports.)

- [ ] **Step 3: Run lint + build to confirm no regressions**

Run: `npm run lint && npm run build`
Expected: both pass; no font-related warnings.

- [ ] **Step 4: Commit**

```bash
git add src/app/fonts.ts src/app/layout.tsx
git commit -m "feat(fonts): centralize font registry, add 7 curated google fonts"
```

---

## Task 3: Extend `SiteSettings` type, fallback, and fetcher

**Files:**
- Modify: `src/lib/cms/site-settings.ts`

- [ ] **Step 1: Extend the `SiteSettings` type**

After the existing `heroAnchorCenter: string;` line in the `SiteSettings` type, add:

```ts
  // Logo (Phase A-LOGO)
  logoMode: 'image' | 'text';
  logoText: string;
  logoFontFamily: string;
  logoFontSize: number;
  logoFontWeight: number;
  logoLetterSpacing: string;
```

- [ ] **Step 2: Extend `FALLBACK`**

After the existing `heroAnchorCenter: 'Chennai · India',` line in the `FALLBACK` object, add:

```ts
  logoMode: 'image',
  logoText: 'Codeminds Digital',
  logoFontFamily: 'geist',
  logoFontSize: 20,
  logoFontWeight: 500,
  logoLetterSpacing: '-0.01em',
```

- [ ] **Step 3: Extend the document → SiteSettings mapping**

After the existing `heroAnchorCenter: stringOr(doc.heroAnchorCenter, FALLBACK.heroAnchorCenter),` line in `fetchSiteSettings()`, add:

```ts
      logoMode: doc.logoMode === 'text' ? 'text' : 'image',
      logoText: stringOr(doc.logoText, FALLBACK.logoText),
      logoFontFamily: stringOr(doc.logoFontFamily, FALLBACK.logoFontFamily),
      logoFontSize: typeof doc.logoFontSize === 'number' ? doc.logoFontSize : FALLBACK.logoFontSize,
      logoFontWeight: typeof doc.logoFontWeight === 'number' ? doc.logoFontWeight : FALLBACK.logoFontWeight,
      logoLetterSpacing: stringOr(doc.logoLetterSpacing, FALLBACK.logoLetterSpacing),
```

- [ ] **Step 4: Run lint + build**

Run: `npm run lint && npm run build`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cms/site-settings.ts
git commit -m "feat(cms): extend SiteSettings with 6 logo-mode fields + fallbacks"
```

---

## Task 4: Build the public `<Wordmark>` server component

**Files:**
- Create: `src/components/site/Wordmark.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Image from 'next/image';
import type { SiteSettings } from '@/lib/cms/site-settings';
import { resolveFont, LOGO_DEFAULTS } from '@/app/fonts';
import { urlForFile, BUCKETS } from '@/lib/appwrite/url-for-asset';

/**
 * Site wordmark. Renders either an uploaded logo image (when
 * logoMode === 'image' and wordmarkFileId is set) or a typeset
 * text logo with the editor's chosen font / size / weight /
 * letter-spacing.
 *
 * Fallback chain:
 *   1. logoMode='image' + wordmarkFileId  → <Image>
 *   2. logoMode='text'  + logoText        → typeset text
 *   3. anything else                      → "Codeminds Digital" in Geist defaults
 *
 * Server component — no client JS.
 */
export function Wordmark({ settings }: { settings: SiteSettings }) {
  const useImage = settings.logoMode !== 'text' && !!settings.wordmarkFileId;

  if (useImage) {
    return (
      <Image
        src={urlForFile(settings.wordmarkFileId!, BUCKETS.publicAssets)}
        alt={settings.ogTitle || LOGO_DEFAULTS.text}
        width={140}
        height={28}
        priority
        unoptimized={settings.wordmarkFileId!.endsWith('.svg')}
      />
    );
  }

  const font = resolveFont(settings.logoFontFamily);
  const text = settings.logoText?.trim() || LOGO_DEFAULTS.text;

  return (
    <span
      className={`${font.className} text-paper-50`}
      style={{
        fontSize: `${settings.logoFontSize || LOGO_DEFAULTS.fontSize}px`,
        fontWeight: settings.logoFontWeight || LOGO_DEFAULTS.fontWeight,
        letterSpacing: settings.logoLetterSpacing || LOGO_DEFAULTS.letterSpacing,
      }}
    >
      {text}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/site/Wordmark.tsx
git commit -m "feat(site): add Wordmark component with image/text fallback"
```

---

## Task 5: Wire `<Wordmark>` into the header

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/HeaderClient.tsx` lines 9, 11, 47–54

- [ ] **Step 1: Update `Header.tsx` to fetch settings and pass the wordmark**

Replace the entire contents of `src/components/layout/Header.tsx` with:

```tsx
import HeaderClient from './HeaderClient';
import { getNavByLocation, getSiteSettings } from '@/lib/cms/site-settings';
import { Wordmark } from '@/components/site/Wordmark';

/**
 * Server-component wrapper. Fetches header nav + site settings from
 * Appwrite (cached + tagged) and pre-renders the wordmark, then hands
 * off to the interactive client. Keeping the wordmark on the server
 * avoids shipping the font registry to the client bundle.
 */
export default async function Header() {
  const [items, settings] = await Promise.all([
    getNavByLocation('header'),
    getSiteSettings(),
  ]);
  const navItems = items.map((i) => ({ href: i.href, label: i.label }));
  return <HeaderClient navItems={navItems} wordmark={<Wordmark settings={settings} />} />;
}
```

- [ ] **Step 2: Update `HeaderClient.tsx` to accept and render the wordmark prop**

In `src/components/layout/HeaderClient.tsx`:

Change line 9 from:
```ts
type NavItem = { href: string; label: string };
```
to:
```ts
import type { ReactNode } from 'react';
type NavItem = { href: string; label: string };
```

Change line 11 from:
```ts
export default function HeaderClient({ navItems }: { navItems: NavItem[] }) {
```
to:
```ts
export default function HeaderClient({
  navItems,
  wordmark,
}: {
  navItems: NavItem[];
  wordmark: ReactNode;
}) {
```

Replace lines 47–54 (the inline wordmark Link block) with:

```tsx
        {/* Wordmark */}
        <Link
          href="/"
          aria-label="Codeminds Digital — home"
          className="inline-flex items-center text-paper-50 hover:text-brand-400 transition-colors"
        >
          {wordmark}
        </Link>
```

- [ ] **Step 3: Smoke-test the dev server**

Run: `npm run dev` (in another terminal) and open `http://localhost:3000/`.
Expected: header still renders "Codeminds Digital" in Geist 20/500 — visually unchanged because no logo fields are populated yet (image mode + empty wordmarkFileId falls through to the text branch with defaults).

Stop the dev server with Ctrl-C.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Header.tsx src/components/layout/HeaderClient.tsx
git commit -m "feat(header): render Wordmark via settings instead of inline text"
```

---

## Task 6: Add the `'logo-mode'` field type to the admin registry

**Files:**
- Modify: `src/lib/admin/collections.ts` lines 13–28, 119–123

- [ ] **Step 1: Extend the `FieldType` union**

Replace the existing `FieldType` union (lines 13–28) with:

```ts
export type FieldType =
  | 'string' // single-line
  | 'text' // multi-line plain
  | 'rich-text' // TipTap JSON document with brand marks
  | 'email'
  | 'url'
  | 'integer'
  | 'boolean'
  | 'enum'
  | 'image' // file ID in public-assets bucket
  | 'reference' // $id in another collection
  // Structured array editors. Persisted as JSON-stringified arrays in
  // the underlying string Appwrite attribute.
  | 'approach-list'
  | 'screens-list'
  | 'metrics-list'
  // Umbrella field for site logo (image OR typeset text). Renders
  // a single fieldset that writes to multiple form keys: logoMode,
  // logoText, logoFontFamily, logoFontSize, logoFontWeight,
  // logoLetterSpacing, wordmarkFileId.
  | 'logo-mode';
```

- [ ] **Step 2: Replace the `wordmarkFileId` field entry with a `logo-mode` entry**

In the `siteSettings` collection's `fields` array, replace the line:

```ts
      { key: 'wordmarkFileId', label: 'Wordmark', type: 'image' },
```

with:

```ts
      // Logo (image OR typeset text) — see <LogoFieldset>.
      { key: 'logo', label: 'Logo', type: 'logo-mode' },
```

- [ ] **Step 3: Run lint to confirm the union update is consistent**

Run: `npm run lint`
Expected: pass. (TS will complain about the unhandled case in `Field.tsx` — that's fixed in the next task.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/admin/collections.ts
git commit -m "feat(admin): introduce logo-mode field type"
```

---

## Task 7: Build the `<LogoFieldset>` admin client component

**Files:**
- Create: `src/components/admin/site-settings/LogoFieldset.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { useState } from 'react';
import ImageUploader from '../ImageUploader';
import { FONT_OPTIONS, LOGO_DEFAULTS, LETTER_SPACING_PATTERN, type FontKey } from '@/app/fonts';

type Props = {
  defaultMode: 'image' | 'text';
  defaultText: string;
  defaultFontFamily: FontKey;
  defaultFontSize: number;
  defaultFontWeight: number;
  defaultLetterSpacing: string;
  defaultWordmarkFileId: string;
};

const WEIGHT_OPTIONS = [100, 300, 400, 500, 600, 700, 800, 900];
const LS_REGEX = new RegExp(LETTER_SPACING_PATTERN);

const inputClass =
  'w-full bg-transparent border-b border-ink-600 focus:border-paper-50 outline-none text-lead text-paper-50 py-2 transition-colors';
const labelClass = 'font-mono text-mono-sm text-paper-400 block mb-2';

/**
 * Logo editor: a mode toggle that swaps between an image uploader and a
 * typography-controls fieldset. Renders a live preview that mirrors the
 * public <Wordmark> component using the editor's current values.
 *
 * State is owned here so toggling between modes does not lose work — the
 * inactive mode's hidden inputs still submit their values.
 */
export default function LogoFieldset(props: Props) {
  const [mode, setMode] = useState<'image' | 'text'>(props.defaultMode);
  const [text, setText] = useState(props.defaultText || LOGO_DEFAULTS.text);
  const [fontFamily, setFontFamily] = useState<FontKey>(props.defaultFontFamily);
  const [fontSize, setFontSize] = useState(props.defaultFontSize || LOGO_DEFAULTS.fontSize);
  const [fontWeight, setFontWeight] = useState(props.defaultFontWeight || LOGO_DEFAULTS.fontWeight);
  const [letterSpacing, setLetterSpacing] = useState(
    props.defaultLetterSpacing || LOGO_DEFAULTS.letterSpacing,
  );
  const lsValid = LS_REGEX.test(letterSpacing);

  const fontOption = FONT_OPTIONS[fontFamily] ?? FONT_OPTIONS[LOGO_DEFAULTS.fontFamily];

  return (
    <fieldset className="space-y-6 border border-ink-700 rounded-lg p-6">
      <legend className="px-2 font-mono text-mono-sm text-paper-400">Logo</legend>

      {/* Mode toggle */}
      <div role="radiogroup" aria-label="Logo mode" className="flex gap-2">
        {(['image', 'text'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 text-sm rounded-full transition-colors ${
              mode === m
                ? 'bg-paper-50 text-ink-900'
                : 'bg-transparent text-paper-300 border border-ink-600 hover:text-paper-50'
            }`}
          >
            {m === 'image' ? 'Upload image' : 'Set as text'}
          </button>
        ))}
      </div>
      <input type="hidden" name="logoMode" value={mode} />

      {/* Live preview */}
      <div className="rounded-lg border border-ink-700 bg-ink-900 p-6 flex items-center min-h-[80px]">
        {mode === 'image' ? (
          <span className="font-mono text-mono-sm text-paper-400">
            {props.defaultWordmarkFileId
              ? 'Image preview rendered above the uploader'
              : 'No image uploaded yet — upload below.'}
          </span>
        ) : (
          <span
            className={`${fontOption.className} text-paper-50`}
            style={{
              fontSize: `${fontSize}px`,
              fontWeight,
              letterSpacing: lsValid ? letterSpacing : LOGO_DEFAULTS.letterSpacing,
            }}
          >
            {text || LOGO_DEFAULTS.text}
          </span>
        )}
      </div>

      {/* Image-mode fields */}
      <div className={mode === 'image' ? 'space-y-2' : 'hidden'}>
        <label className={labelClass}>Wordmark image</label>
        <ImageUploader name="wordmarkFileId" defaultValue={props.defaultWordmarkFileId} />
      </div>

      {/* Text-mode fields */}
      <div className={mode === 'text' ? 'space-y-4' : 'hidden'}>
        <div>
          <label htmlFor="logoText" className={labelClass}>Logo text</label>
          <input
            id="logoText"
            name="logoText"
            type="text"
            maxLength={64}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="logoFontFamily" className={labelClass}>Font family</label>
          <select
            id="logoFontFamily"
            name="logoFontFamily"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value as FontKey)}
            className={`${inputClass} appearance-none cursor-pointer pr-8`}
          >
            {Object.values(FONT_OPTIONS).map((o) => (
              <option key={o.key} value={o.key} className="bg-ink-800">
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="logoFontSize" className={labelClass}>Size (px)</label>
            <input
              id="logoFontSize"
              name="logoFontSize"
              type="number"
              min={12}
              max={48}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value) || LOGO_DEFAULTS.fontSize)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="logoFontWeight" className={labelClass}>Weight</label>
            <select
              id="logoFontWeight"
              name="logoFontWeight"
              value={fontWeight}
              onChange={(e) => setFontWeight(Number(e.target.value))}
              className={`${inputClass} appearance-none cursor-pointer pr-8`}
            >
              {WEIGHT_OPTIONS.map((w) => (
                <option key={w} value={w} className="bg-ink-800">
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="logoLetterSpacing" className={labelClass}>Letter spacing</label>
          <input
            id="logoLetterSpacing"
            name="logoLetterSpacing"
            type="text"
            maxLength={16}
            value={letterSpacing}
            onChange={(e) => setLetterSpacing(e.target.value)}
            className={inputClass}
            aria-invalid={!lsValid}
          />
          <p
            className={`font-mono text-mono-sm mt-2 ${
              lsValid ? 'text-paper-400' : 'text-red-400'
            }`}
          >
            {lsValid
              ? 'CSS length, e.g. -0.01em, 0.5px, 1rem, or "normal".'
              : 'Must be a CSS length (em/px/rem) or "normal".'}
          </p>
        </div>
      </div>
    </fieldset>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/site-settings/LogoFieldset.tsx
git commit -m "feat(admin): add LogoFieldset with live preview and mode toggle"
```

---

## Task 8: Render the umbrella field in `<Field>`

**Files:**
- Modify: `src/components/admin/Field.tsx`

- [ ] **Step 1: Import `LogoFieldset` and the SiteSettings type**

Add after the existing imports at the top of the file:

```ts
import LogoFieldset from './site-settings/LogoFieldset';
import type { SiteSettings } from '@/lib/cms/site-settings';
import type { FontKey } from '@/app/fonts';
```

- [ ] **Step 2: Make `Field` aware of the surrounding document**

Change the `FieldProps` type to include the full document context (the umbrella field needs siblings, not just its own value):

Replace the existing `type FieldProps = { ... };` with:

```ts
type FieldProps = {
  field: FieldConfig;
  value: unknown;
  /** The full document — used by composite fields (e.g. logo-mode). */
  doc?: Partial<SiteSettings> & Record<string, unknown>;
};
```

Update the function signature on the same line as `export default function Field(...)`:

```ts
export default function Field({ field, value, error, doc }: FieldProps & { error?: string }) {
```

And pass `doc` into `renderControl`:

```ts
      {renderControl(field, v, doc)}
```

Update the `renderControl` signature:

```ts
function renderControl(field: FieldConfig, v: unknown, doc?: Record<string, unknown>) {
```

- [ ] **Step 3: Add the `logo-mode` case**

Inside `renderControl`'s switch, immediately before the `case 'string':` arm, add:

```ts
    case 'logo-mode': {
      const d = (doc ?? {}) as Partial<SiteSettings>;
      return (
        <LogoFieldset
          defaultMode={d.logoMode === 'text' ? 'text' : 'image'}
          defaultText={typeof d.logoText === 'string' ? d.logoText : ''}
          defaultFontFamily={(typeof d.logoFontFamily === 'string' ? d.logoFontFamily : 'geist') as FontKey}
          defaultFontSize={typeof d.logoFontSize === 'number' ? d.logoFontSize : 20}
          defaultFontWeight={typeof d.logoFontWeight === 'number' ? d.logoFontWeight : 500}
          defaultLetterSpacing={typeof d.logoLetterSpacing === 'string' ? d.logoLetterSpacing : '-0.01em'}
          defaultWordmarkFileId={typeof d.wordmarkFileId === 'string' ? d.wordmarkFileId : ''}
        />
      );
    }
```

- [ ] **Step 4: Pass `doc` from the edit form**

Find the call site that renders `<Field …/>` — in this repo it lives in `src/components/admin/EditForm.tsx`. Open that file and locate the `<Field field={f} value={…} error={…} />` line. Update it to also pass `doc={doc}` where `doc` is the full document object the form is editing. (If the form receives `initial: Record<string, unknown>` as a prop, pass `doc={initial}`.)

If you cannot find the call site, run:
```
rg -n "<Field" src/components/admin/
```
and add `doc={…}` to every match where the document object is in scope.

- [ ] **Step 5: Run lint + build**

Run: `npm run lint && npm run build`
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/Field.tsx src/components/admin/EditForm.tsx
git commit -m "feat(admin): render logo-mode field via LogoFieldset"
```

---

## Task 9: Extend `coerce()` to extract logo-mode sub-keys

**Files:**
- Modify: `src/app/admin/(authed)/[collection]/[id]/actions.ts` — the `coerce` function (around lines 39–66)

- [ ] **Step 1: Update `coerce` to handle the umbrella type**

Replace the entire `coerce` function with:

```ts
function coerce(form: FormData, collectionId: string): Record<string, unknown> {
  const cfg = getCollection(collectionId);
  if (!cfg) throw new Error(`Unknown collection: ${collectionId}`);

  const out: Record<string, unknown> = {};
  for (const f of cfg.fields) {
    if (f.type === 'logo-mode') {
      // Umbrella field — extract the 7 sub-keys directly from FormData.
      const mode = String(form.get('logoMode') ?? 'image');
      out.logoMode = mode === 'text' ? 'text' : 'image';

      const text = String(form.get('logoText') ?? '').trim();
      if (text !== '') out.logoText = text;

      const fontFamily = String(form.get('logoFontFamily') ?? '').trim();
      if (fontFamily !== '') out.logoFontFamily = fontFamily;

      const fontSize = Number(form.get('logoFontSize'));
      if (!Number.isNaN(fontSize) && fontSize >= 12 && fontSize <= 48) {
        out.logoFontSize = fontSize;
      }

      const fontWeight = Number(form.get('logoFontWeight'));
      if (!Number.isNaN(fontWeight) && fontWeight >= 100 && fontWeight <= 900) {
        out.logoFontWeight = fontWeight;
      }

      const ls = String(form.get('logoLetterSpacing') ?? '').trim();
      if (ls !== '' && /^-?\d*\.?\d+(em|px|rem)$|^normal$/.test(ls)) {
        out.logoLetterSpacing = ls;
      }

      const wordmark = String(form.get('wordmarkFileId') ?? '').trim();
      if (wordmark !== '') out.wordmarkFileId = wordmark;
      continue;
    }

    const raw = form.get(f.key);
    if (raw === null || raw === undefined) continue;
    const str = String(raw).trim();

    if (str === '' && !f.required) continue;
    if (str === '' && f.required) {
      throw new Error(`${f.label} is required`);
    }

    switch (f.type) {
      case 'integer':
        out[f.key] = Number(str);
        if (Number.isNaN(out[f.key])) throw new Error(`${f.label} must be a number`);
        break;
      case 'boolean':
        out[f.key] = str === 'true' || str === 'on' || str === '1';
        break;
      default:
        out[f.key] = str;
    }
  }
  return out;
}
```

- [ ] **Step 2: Run lint + build**

Run: `npm run lint && npm run build`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add 'src/app/admin/(authed)/[collection]/[id]/actions.ts'
git commit -m "feat(admin): extract logo-mode sub-keys in saveDocument coerce"
```

---

## Task 10: Smoke test the round-trip

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify image-mode (default) renders unchanged**

Open `http://localhost:3000/`. Confirm the header still reads "Codeminds Digital" (Geist 20/500). No layout shift.

- [ ] **Step 3: Sign in to admin and edit logo**

Go to `http://localhost:3000/admin/login` → sign in → navigate to `Site Settings`.

Confirm:
- A "Logo" fieldset is visible at the top with two pill buttons: **Upload image** (selected) / **Set as text**.
- Below them, a preview box shows "No image uploaded yet — upload below."
- The image uploader appears below.

- [ ] **Step 4: Switch to text mode and pick Instrument Serif**

Click **Set as text**. Confirm:
- The preview box now renders "Codeminds Digital" in Geist.
- The image uploader hides; text + font + size + weight + letter-spacing fields appear.

Change Font family to **Instrument Serif (brand)**. Set size to **28**, weight to **400**. Confirm the preview re-renders in serif at 28/400 immediately.

Click **Save**.

- [ ] **Step 5: Verify the public site updated**

Open `http://localhost:3000/` in another tab and refresh. The header wordmark should now read "Codeminds Digital" in Instrument Serif at 28/400.

- [ ] **Step 6: Toggle back to image mode**

Back in admin, click **Upload image**. Confirm font fields disappear; the uploader is back. **Save**.

Refresh `/`. Header reverts to Geist text (image-mode default — no image uploaded yet, so the renderer falls through to text branch with defaults). This is expected behavior per the fallback chain.

- [ ] **Step 7: Stop the dev server**

Ctrl-C the dev server.

- [ ] **Step 8: No commit needed (verification only).**

---

## Task 11: Extend the QA CRUD probe

**Files:**
- Modify: `scripts/qa-crud-probe.mjs` — the `siteSettings` probe call

- [ ] **Step 1: Add the new fields to both payloads**

In `scripts/qa-crud-probe.mjs`, replace the existing `await probe('siteSettings', ...)` call with:

```js
  await probe(
    'siteSettings',
    {
      contactEmail: `${TAG}@example.com`,
      ogTitle: `qa ${TAG}`,
      logoMode: 'text',
      logoText: 'QA Wordmark',
      logoFontFamily: 'instrument-serif',
      logoFontSize: 24,
      logoFontWeight: 500,
      logoLetterSpacing: '-0.02em',
    },
    {
      ogTitle: `qa ${TAG} updated`,
      themeColor: '#123456',
      logoMode: 'image',
      logoFontSize: 32,
      logoLetterSpacing: 'normal',
    },
  );
```

- [ ] **Step 2: Run the probe**

Run: `node scripts/qa-crud-probe.mjs`
Expected: `ok    siteSettings    ~1100ms` and a final `Summary: 11/11 passed`.

- [ ] **Step 3: Commit**

```bash
git add scripts/qa-crud-probe.mjs
git commit -m "test(qa): cover logo-mode fields in CRUD probe"
```

---

## Task 12: Final verification

- [ ] **Step 1: Lint + build**

Run: `npm run lint && npm run build`
Expected: both pass with no warnings introduced by this feature.

- [ ] **Step 2: QA suite**

Run all three probes (server must be running on `localhost:3000` for the workflow + edge probes):

```bash
npm run dev &              # background
sleep 5
node scripts/qa-crud-probe.mjs && \
  node scripts/qa-workflow-probe.mjs && \
  node scripts/qa-edge-probe.mjs
kill %1                    # stop dev server
```

Expected: all three probes report 100% passes (11/11, 10/10, 14/14).

- [ ] **Step 3: Tag-and-summarize commit (optional)**

If desired, add a final aggregating commit with no code changes — just a short note in `docs/superpowers/specs/2026-04-30-admin-text-logo-design.md` updating Status to `Implemented (YYYY-MM-DD)`.

```bash
git add docs/superpowers/specs/2026-04-30-admin-text-logo-design.md
git commit -m "docs: mark text-logo spec as implemented"
```

---

## Self-review notes (left in plan for the executor)

- **Spec coverage:** every section of `docs/superpowers/specs/2026-04-30-admin-text-logo-design.md` is implemented across Tasks 1–11. Schema → Task 1. Font allowlist → Task 2. SiteSettings type → Task 3. Wordmark render path → Tasks 4–5. Admin UI mode toggle + live preview → Tasks 6–8. saveDocument coercion → Task 9. Tests / QA → Task 11.
- **No placeholders.** Every code block is complete; no "TODO", "TBD", or "similar to above".
- **Type consistency:** `FontKey`, `FontOption`, `LOGO_DEFAULTS`, `LETTER_SPACING_PATTERN`, and the `'logo-mode'` literal are defined exactly once and referenced consistently. The `SiteSettings.logoMode` union (`'image' | 'text'`) and the FormData hidden input both use the same two strings.
- **Ambiguity check:** the umbrella field `key: 'logo'` does not collide with any existing siteSettings attribute (Appwrite ignores it because it's never written to the document — `coerce` writes the seven sub-keys instead). Documented in the comment on the `logo-mode` case.
