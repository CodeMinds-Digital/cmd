import 'server-only';
import { unstable_cache as nextCache } from 'next/cache';
import { databases, Query } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID } from '@/lib/appwrite/env';

export type SiteSettings = {
  wordmarkFileId: string | null;
  faviconFileId: string | null;
  appleTouchIconFileId: string | null;
  ogImageFileId: string | null;
  themeColor: string;
  ogTitle: string;
  ogSubtitle: string;
  contactEmail: string;
  phone: string;
  bookingUrl: string;
  twitterHandle: string;
  githubHandle: string;
  linkedinHandle: string;

  // Hero copy (Phase A4.6)
  heroEyebrow: string;
  heroLine1: string;
  heroLine2: string;
  heroLine2Accent: string;
  heroSub: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaHref: string;
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaHref: string;
  heroAnchorLeft: string;
  heroAnchorCenter: string;
};

const FALLBACK: SiteSettings = {
  wordmarkFileId: null,
  faviconFileId: null,
  appleTouchIconFileId: null,
  ogImageFileId: null,
  themeColor: '#0a0a0c',
  ogTitle: 'Codeminds Digital',
  ogSubtitle: 'A digital studio for web, mobile, and AI · Chennai → worldwide',
  contactEmail: 'cmd@codeminds.digital',
  phone: '',
  bookingUrl: 'https://cal.com/codeminds',
  twitterHandle: 'codeminds',
  githubHandle: 'codeminds',
  linkedinHandle: 'codeminds',

  heroEyebrow: 'Booking new projects',
  heroLine1: 'Software,',
  heroLine2: 'built with',
  heroLine2Accent: 'care.',
  heroSub:
    'A digital studio for web, mobile, and AI. Two-to-four-week delivery from Chennai → worldwide.',
  heroPrimaryCtaLabel: 'Start a project',
  heroPrimaryCtaHref: '#contact',
  heroSecondaryCtaLabel: 'See selected work',
  heroSecondaryCtaHref: '#work',
  heroAnchorLeft: 'Codeminds Digital · v2026.1',
  heroAnchorCenter: 'Chennai · India',
};

async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const doc = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      'siteSettings',
      'siteSettings',
    );
    return {
      wordmarkFileId: stringOrNull(doc.wordmarkFileId),
      faviconFileId: stringOrNull(doc.faviconFileId),
      appleTouchIconFileId: stringOrNull(doc.appleTouchIconFileId),
      ogImageFileId: stringOrNull(doc.ogImageFileId),
      themeColor: stringOr(doc.themeColor, FALLBACK.themeColor),
      ogTitle: stringOr(doc.ogTitle, FALLBACK.ogTitle),
      ogSubtitle: stringOr(doc.ogSubtitle, FALLBACK.ogSubtitle),
      contactEmail: stringOr(doc.contactEmail, FALLBACK.contactEmail),
      phone: stringOr(doc.phone, FALLBACK.phone),
      bookingUrl: stringOr(doc.bookingUrl, FALLBACK.bookingUrl),
      twitterHandle: stringOr(doc.twitterHandle, FALLBACK.twitterHandle),
      githubHandle: stringOr(doc.githubHandle, FALLBACK.githubHandle),
      linkedinHandle: stringOr(doc.linkedinHandle, FALLBACK.linkedinHandle),

      heroEyebrow: stringOr(doc.heroEyebrow, FALLBACK.heroEyebrow),
      heroLine1: stringOr(doc.heroLine1, FALLBACK.heroLine1),
      heroLine2: stringOr(doc.heroLine2, FALLBACK.heroLine2),
      heroLine2Accent: stringOr(doc.heroLine2Accent, FALLBACK.heroLine2Accent),
      heroSub: stringOr(doc.heroSub, FALLBACK.heroSub),
      heroPrimaryCtaLabel: stringOr(doc.heroPrimaryCtaLabel, FALLBACK.heroPrimaryCtaLabel),
      heroPrimaryCtaHref: stringOr(doc.heroPrimaryCtaHref, FALLBACK.heroPrimaryCtaHref),
      heroSecondaryCtaLabel: stringOr(doc.heroSecondaryCtaLabel, FALLBACK.heroSecondaryCtaLabel),
      heroSecondaryCtaHref: stringOr(doc.heroSecondaryCtaHref, FALLBACK.heroSecondaryCtaHref),
      heroAnchorLeft: stringOr(doc.heroAnchorLeft, FALLBACK.heroAnchorLeft),
      heroAnchorCenter: stringOr(doc.heroAnchorCenter, FALLBACK.heroAnchorCenter),
    };
  } catch {
    // Document not yet created — return baked-in defaults.
    return FALLBACK;
  }
}

/**
 * Cached site-settings fetcher. The cache is tagged "site-settings" so
 * the /api/revalidate webhook (configured in A0) invalidates it on every
 * publish event from Appwrite.
 */
export const getSiteSettings = nextCache(
  fetchSiteSettings,
  ['site-settings'],
  { tags: ['site-settings', 'siteSettings'] },
);

export type NavItem = {
  $id: string;
  label: string;
  href: string;
  location: NavLocation;
  orderIndex: number;
};

export type NavLocation =
  | 'header'
  | 'footer-studio'
  | 'footer-work'
  | 'footer-contact'
  | 'footer-legal';

const NAV_FALLBACK: NavItem[] = [
  { $id: 'fallback-h-1', label: 'Work',    href: '/work',    location: 'header', orderIndex: 0 },
  { $id: 'fallback-h-2', label: 'Studio',  href: '/studio',  location: 'header', orderIndex: 1 },
  { $id: 'fallback-h-3', label: 'Journal', href: '/journal', location: 'header', orderIndex: 2 },
  { $id: 'fallback-fs-1', label: 'Home',         href: '/',           location: 'footer-studio', orderIndex: 0 },
  { $id: 'fallback-fs-2', label: 'About',        href: '/studio',     location: 'footer-studio', orderIndex: 1 },
  { $id: 'fallback-fs-3', label: 'Capabilities', href: '/#capabilities', location: 'footer-studio', orderIndex: 2 },
  { $id: 'fallback-fw-1', label: 'All work',         href: '/work',                              location: 'footer-work', orderIndex: 0 },
  { $id: 'fallback-fw-2', label: 'Fintech rebuild', href: '/work/fintech-marketing-rebuild',     location: 'footer-work', orderIndex: 1 },
  { $id: 'fallback-fw-3', label: 'Journal',          href: '/journal',                           location: 'footer-work', orderIndex: 2 },
  { $id: 'fallback-fc-1', label: 'cmd@codeminds.digital', href: 'mailto:cmd@codeminds.digital', location: 'footer-contact', orderIndex: 0 },
  { $id: 'fallback-fc-2', label: 'Book a call',           href: 'https://cal.com/codeminds',     location: 'footer-contact', orderIndex: 1 },
  { $id: 'fallback-fc-3', label: 'Project brief',         href: '/#contact',                     location: 'footer-contact', orderIndex: 2 },
  { $id: 'fallback-fl-1', label: 'Privacy', href: '/legal/privacy', location: 'footer-legal', orderIndex: 0 },
  { $id: 'fallback-fl-2', label: 'Terms',   href: '/legal/terms',   location: 'footer-legal', orderIndex: 1 },
];

async function fetchNavItems(): Promise<NavItem[]> {
  try {
    const res = await databases.listDocuments(APPWRITE_DATABASE_ID, 'navItem', [
      Query.limit(100),
      Query.orderAsc('location'),
      Query.orderAsc('orderIndex'),
    ]);

    if (res.total === 0) return NAV_FALLBACK;

    return res.documents.map((d) => ({
      $id: d.$id,
      label: stringOr(d.label, ''),
      href: stringOr(d.href, '#'),
      location: stringOr(d.location, 'header') as NavLocation,
      orderIndex: typeof d.orderIndex === 'number' ? d.orderIndex : 0,
    }));
  } catch {
    return NAV_FALLBACK;
  }
}

export const getNavItems = nextCache(fetchNavItems, ['nav-items'], {
  tags: ['nav-items', 'navItem'],
});

export async function getNavByLocation(loc: NavLocation): Promise<NavItem[]> {
  const all = await getNavItems();
  return all.filter((n) => n.location === loc).sort((a, b) => a.orderIndex - b.orderIndex);
}

// ── helpers ──────────────────────────────────────────────────────────
function stringOrNull(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}
function stringOr(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}
