import Link from 'next/link';
import { getNavByLocation, getSiteSettings } from '@/lib/cms/site-settings';

const COLUMNS: { label: string; location: 'footer-studio' | 'footer-work' | 'footer-contact' | 'footer-legal' }[] = [
  { label: 'Studio',  location: 'footer-studio' },
  { label: 'Work',    location: 'footer-work' },
  { label: 'Contact', location: 'footer-contact' },
  { label: 'Legal',   location: 'footer-legal' },
];

export default async function Footer() {
  const [studio, work, contact, legal, settings] = await Promise.all([
    getNavByLocation('footer-studio'),
    getNavByLocation('footer-work'),
    getNavByLocation('footer-contact'),
    getNavByLocation('footer-legal'),
    getSiteSettings(),
  ]);

  const columns = [
    { label: 'Studio',  items: studio },
    { label: 'Work',    items: work },
    { label: 'Contact', items: contact },
    { label: 'Legal',   items: legal },
  ];

  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink-900 border-t border-ink-700">
      <div className="container py-20 md:py-24">
        {/* Big anchor — wordmark */}
        <div className="mb-16 md:mb-24">
          <h2 className="text-h1 md:text-display font-bold text-paper-50 leading-none">
            Codeminds
            <span className="font-serif italic font-normal text-brand-400">·</span>
            Digital
          </h2>
          <p className="font-mono text-mono-sm text-paper-400 mt-4">
            Software studio · Chennai · IST
          </p>
        </div>

        {/* 4-column nav driven by Appwrite navItem collection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16">
          {columns.map((col) => (
            <div key={col.label}>
              <div className="font-mono text-mono-sm text-paper-400 mb-4">
                {col.label}
              </div>
              <ul className="space-y-3">
                {col.items.length === 0 ? (
                  <li className="font-mono text-mono-sm text-paper-400/40 italic">
                    —
                  </li>
                ) : (
                  col.items.map((item) => (
                    <li key={item.$id}>
                      <Link
                        href={item.href}
                        className="text-body text-paper-100 hover:text-brand-400 transition-colors"
                        target={item.href.startsWith('http') ? '_blank' : undefined}
                        rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Anchor strip — pulls contact email from siteSettings if set */}
        <div className="pt-8 border-t border-ink-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4 font-mono text-mono-sm text-paper-400">
          <span>CODEMINDS DIGITAL · v2026.1</span>
          <span className="hidden md:inline">© {year} — ALL RIGHTS RESERVED</span>
          <span>{settings.contactEmail}</span>
        </div>
      </div>
    </footer>
  );
}
