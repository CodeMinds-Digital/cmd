# Admin Text-Logo Mode — Design

**Date:** 2026-04-30
**Owner:** Naveen
**Status:** Approved (pending implementation plan)

## Problem

The header wordmark is image-only today (`siteSettings.wordmarkFileId`).
Editors who want a quick rename, a different weight, or a fresh typeface
have to open Figma, export an SVG, and re-upload. There is no way to
preview a typographic logo from inside `/admin`.

## Goal

Let an admin choose, per site, whether the header logo is an **uploaded
image** or **typeset text** with a small set of typography controls.
Image mode must remain the default so the live site keeps rendering its
existing wordmark with zero migration friction.

## Non-Goals

- Per-page or per-section logo overrides.
- Free-form font URLs / arbitrary Google Fonts. (Allowlist only.)
- Color, italic, uppercase, multi-line accents, or animated wordmarks.
  These are explicitly out of scope to keep the brand surface tight.
- Favicon / OG image regeneration from the text logo (image-mode still
  drives those — OG card has its own typography pipeline).

## Schema additions — `siteSettings`

| Key                 | Type    | Constraints                  | Default        |
|---------------------|---------|------------------------------|----------------|
| `logoMode`          | string  | size 8, enum: `image`/`text` | `image`        |
| `logoText`          | string  | size 64                      | _(empty)_      |
| `logoFontFamily`    | string  | size 32, enum (10 entries)   | `geist`        |
| `logoFontSize`      | integer | min 12, max 48               | `20`           |
| `logoFontWeight`    | integer | min 100, max 900             | `500`          |
| `logoLetterSpacing` | string  | size 16, regex below         | `-0.01em`      |

`logoLetterSpacing` regex: `^-?\d*\.?\d+(em|px|rem)$|^normal$`

All six attributes are `required: false` so existing rows stay valid;
defaults are applied at the application layer when a field is missing.

### Font allowlist

Single source of truth: `src/lib/admin/font-options.ts`.

| Key                 | Family             | Source              |
|---------------------|--------------------|---------------------|
| `geist`             | Geist              | brand (existing)    |
| `geist-mono`        | Geist Mono         | brand (existing)    |
| `instrument-serif`  | Instrument Serif   | brand (existing)    |
| `inter`             | Inter              | curated             |
| `manrope`           | Manrope            | curated             |
| `playfair`          | Playfair Display   | curated             |
| `dm-serif-display`  | DM Serif Display   | curated             |
| `space-grotesk`     | Space Grotesk      | curated             |
| `fraunces`          | Fraunces           | curated             |
| `jetbrains-mono`    | JetBrains Mono     | curated             |

Curated fonts are loaded via `next/font/google` in `src/app/fonts.ts`
with `display: 'swap'`, `preload: false` (only the 3 brand fonts
preload), and subsetted to `latin` to keep payload small.

## Admin UI

Path: `/admin/site-settings`.

A **Logo mode** segmented control toggles between two field groups:

- **Image** — existing `<ImageUploader fileId={wordmarkFileId} />`
  unchanged.
- **Text** — `logoText` input, `logoFontFamily` select, `logoFontSize`
  number input (slider stretch), `logoFontWeight` select (100/300/400/
  500/600/700/800), `logoLetterSpacing` text input.

Above the field group, a **live preview** renders the same `<Wordmark>`
component the public header uses, fed by the form's current values.
Switching modes hides the inactive group's fields but keeps their
values in form state — toggling back restores them.

The mode toggle is implemented in
`src/components/admin/site-settings/LogoFieldset.tsx` (new, client
component) so it can react to local state without a round-trip.

## Render path

`src/components/site/Wordmark.tsx` (new, server component):

```tsx
export function Wordmark({ settings }: { settings: SiteSettings }) {
  if (settings.logoMode !== 'text' && settings.wordmarkFileId) {
    return (
      <Image
        src={urlForFile(settings.wordmarkFileId, BUCKETS.publicAssets)}
        alt={settings.ogTitle ?? 'Codeminds Digital'}
        width={140} height={28} priority
      />
    );
  }
  const font = resolveFont(settings.logoFontFamily);
  return (
    <span
      className={font.className}
      style={{
        fontSize: `${settings.logoFontSize ?? 20}px`,
        fontWeight: settings.logoFontWeight ?? 500,
        letterSpacing: settings.logoLetterSpacing ?? '-0.01em',
      }}
    >
      {settings.logoText?.trim() || 'Codeminds Digital'}
    </span>
  );
}
```

Header (`src/components/site/Header.tsx`) replaces its inline `<Image>`
wordmark with `<Wordmark settings={settings} />`. No other consumers.

Fallback chain when `logoMode` is `text` but text is empty: render
`'Codeminds Digital'` in default Geist 20/500/-0.01em — never an empty
node, never a layout shift.

## Validation

Add a new `FieldType` value `'enum-font'` in
`src/lib/admin/collections.ts` whose options come from
`FONT_OPTIONS`. The existing `validateField()` already handles enum
membership, integer bounds, regex patterns, and required flags — the
new fields plug in without changing the validator's shape.

## Migration

`scripts/bootstrap-appwrite.mjs` adds the six attributes idempotently
(the script's `existingAttributeKeys()` cache already prevents
duplicate-attr errors). No content migration is needed: rows without
`logoMode` are treated as `image` by the renderer.

## Cache invalidation

`siteSettings` already has a `'site-settings'` cache tag in
`src/lib/cms/site-settings.ts`. Edits flow through the existing
`saveDocument` → `revalidateTag('site-settings', 'max')` path. No new
tags needed.

## Files touched

**New**
- `src/components/site/Wordmark.tsx`
- `src/components/admin/site-settings/LogoFieldset.tsx`
- `src/lib/admin/font-options.ts`

**Modified**
- `appwrite.json` — six new `siteSettings` attributes
- `scripts/bootstrap-appwrite.mjs` — picks up new attrs automatically
- `src/app/fonts.ts` — register 7 curated Google Fonts
- `src/lib/admin/collections.ts` — add `enum-font` field type, expose
  the new `siteSettings` fields
- `src/components/admin/Field.tsx` — render the new field type
- `src/components/site/Header.tsx` — swap inline `<Image>` for `<Wordmark>`
- `src/types/site-settings.ts` (or wherever the type lives) — extend
  `SiteSettings` interface

## Test plan

- **Schema:** `npm run appwrite:bootstrap` is idempotent on a clean
  project and on a project that already has the new attrs.
- **Image mode (default):** Existing site renders unchanged after
  migration; no console warnings; header height does not shift.
- **Text mode happy path:** Switch mode, type "Codeminds", pick
  Instrument Serif, weight 600, size 24, save → header re-renders the
  text wordmark; cache tag invalidation propagates within a single
  request.
- **Validation:** font outside allowlist, size 8 or 60, weight 50,
  letter-spacing `"foo"` all return field-level errors before submit.
- **Fallback:** text mode + empty `logoText` renders the default
  `Codeminds Digital` in Geist 20/500/-0.01em.
- **Round-trip:** toggle mode → text → mode → image → mode → text:
  field values for both modes survive each toggle until save.
- **CRUD probe:** add `logoMode/logoText/...` to
  `scripts/qa-crud-probe.mjs`'s `siteSettings` payloads to keep the QA
  suite covering the new fields.

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Curated Google Fonts add bundle weight | Subset to `latin`, `preload: false`, `display: 'swap'` |
| Editor picks an unreadable size/weight combo | Live preview surfaces the bad combo before save |
| Letter-spacing field accepts non-CSS strings | Regex validator on save + Appwrite size-16 cap |
| Mode toggle confuses non-technical editors | Segmented control with both labels visible + helper text "Show an image, or set the wordmark in type" |
