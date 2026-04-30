import HeroClient, { type HeroCopy } from './HeroClient';
import { getSiteSettings } from '@/lib/cms/site-settings';

/**
 * Server wrapper. Reads hero copy from siteSettings (cached + tagged)
 * and hands it to the interactive client. Falls back to baked-in defaults
 * when Appwrite is unreachable.
 */
export default async function Hero() {
  const s = await getSiteSettings();

  const copy: HeroCopy = {
    eyebrow: s.heroEyebrow,
    line1: s.heroLine1,
    line2: s.heroLine2,
    line2Accent: s.heroLine2Accent,
    sub: s.heroSub,
    primaryCta: { label: s.heroPrimaryCtaLabel, href: s.heroPrimaryCtaHref },
    secondaryCta: { label: s.heroSecondaryCtaLabel, href: s.heroSecondaryCtaHref },
    anchorLeft: s.heroAnchorLeft,
    anchorCenter: s.heroAnchorCenter,
  };

  return <HeroClient copy={copy} />;
}
