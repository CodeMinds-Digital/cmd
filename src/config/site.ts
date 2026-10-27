/**
 * Site structure that ships with the code: name, release label, navigation.
 * Editable studio facts (email, city, booking, delivery window…) live in
 * Appwrite `siteSettings` and are read with getSite() / getSiteSettings().
 */
export type NavItem = { href: string; label: string };

export const siteConfig = {
  name: 'Codeminds Digital',
  version: 'v2026.1',
  nav: [
    { href: '/work', label: 'Work' },
    { href: '/studio', label: 'Studio' },
    { href: '/journal', label: 'Journal' },
  ] satisfies NavItem[],
} as const;
