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
