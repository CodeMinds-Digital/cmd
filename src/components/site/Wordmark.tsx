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
