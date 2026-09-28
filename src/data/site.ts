/**
 * Site-wide facts shown in the chrome and the hero. Single source of truth so
 * copy like the booking status or delivery window is edited in one place
 * (and can later be swapped for a CMS query).
 */

export type NavItem = { href: string; label: string };

export const site = {
  name: 'Codeminds Digital',
  version: 'v2026.1',
  email: 'cmd@codeminds.digital',
  calUrl: 'https://cal.com/codeminds',
  city: 'Chennai',
  country: 'India',
  timezoneLabel: 'IST · UTC+5:30',
  replyWithin: '24 hours',

  nav: [
    { href: '/work', label: 'Work' },
    { href: '/studio', label: 'Studio' },
    { href: '/journal', label: 'Journal' },
  ] satisfies NavItem[],

  /** Delivery window, in weeks, for the hero stat tile. */
  delivery: { minWeeks: 2, maxWeeks: 4 },

  disciplines: ['Web', 'Mobile', 'AI'],

  booking: {
    open: true,
    /**
     * Optional availability detail, e.g. "2 slots in Oct". Leave null unless
     * it's true and someone owns keeping it current (plan open question Q4).
     */
    detail: null as string | null,
  },
} as const;
