import Link from 'next/link';
import { cases } from '@/data/cases';
import { site } from '@/data/site';

type FooterLink = { href: string; label: string; external?: boolean };

const liveCase = cases.find((c) => c.status === 'live');

const columns: { label: string; links: FooterLink[] }[] = [
  {
    label: 'Studio',
    links: [
      { href: '/', label: 'Home' },
      { href: '/studio', label: 'About' },
      { href: '/#capabilities', label: 'Capabilities' },
      { href: '/#process', label: 'How we work' },
    ],
  },
  {
    label: 'Work',
    links: [
      { href: '/work', label: 'All work' },
      ...(liveCase ? [{ href: `/work/${liveCase.slug}`, label: 'Latest case' }] : []),
      { href: '/journal', label: 'Journal' },
    ],
  },
  {
    label: 'Contact',
    links: [
      { href: `mailto:${site.email}`, label: site.email },
      { href: site.calUrl, label: 'Book a call', external: true },
      { href: '/#contact', label: 'Project brief' },
    ],
  },
];

/**
 * Footer — link columns, anchor strip, and an oversized wordmark clipped by
 * the bottom edge of the page (plan §4).
 */
export default function Footer() {
  return (
    <footer className="overflow-hidden border-t border-line">
      <div className="container pt-16 md:pt-24">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="max-w-xs font-display text-step-2 font-bold text-fg">
              Software, built with care — from {site.city}.
            </p>
            <p className="mt-3 text-body">
              {site.booking.open ? 'Booking new projects.' : 'Currently fully booked.'} We reply within{' '}
              {site.replyWithin}.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8">
            {columns.map((col) => (
              <div key={col.label}>
                <h2 className="mb-4 font-mono text-mono-xs uppercase text-fg-subtle">{col.label}</h2>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noreferrer' : undefined}
                        className="text-step-0 text-fg underline-offset-4 hover:text-accent-ink hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-line pt-6 font-mono text-mono-xs uppercase text-fg-subtle md:flex-row md:items-center md:justify-between">
          <span>
            {site.name} · {site.version}
          </span>
          <span>© {new Date().getFullYear()} — All rights reserved</span>
          <span>
            {site.city} · {site.country}
          </span>
        </div>
      </div>

      {/* Oversized wordmark, cut off by the page's bottom edge. Decorative. */}
      <div aria-hidden className="container mt-10 h-[0.68em] select-none text-[clamp(3rem,17vw,13.75rem)] md:mt-16">
        <p className="flex items-baseline font-display font-bold leading-[0.8] tracking-[-0.06em] text-fg">
          codeminds<span className="text-accent">.</span>
        </p>
      </div>
    </footer>
  );
}
