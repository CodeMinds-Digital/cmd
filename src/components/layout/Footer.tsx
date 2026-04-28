import Link from 'next/link';

const cols = [
  {
    label: 'Studio',
    items: [
      { href: '/', label: 'Home' },
      { href: '/studio', label: 'About' },
      { href: '/#capabilities', label: 'Capabilities' },
    ],
  },
  {
    label: 'Work',
    items: [
      { href: '/work', label: 'All work' },
      { href: '/work/fintech-marketing-rebuild', label: 'Fintech rebuild' },
      { href: '/journal', label: 'Journal' },
    ],
  },
  {
    label: 'Contact',
    items: [
      { href: 'mailto:cmd@codeminds.digital', label: 'cmd@codeminds.digital' },
      { href: 'https://cal.com/codeminds', label: 'Book a call' },
      { href: '/#contact', label: 'Project brief' },
    ],
  },
];

export default function Footer() {
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

        {/* 3-column nav */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16">
          {cols.map((col) => (
            <div key={col.label}>
              <div className="font-mono text-mono-sm text-paper-400 mb-4">
                {col.label}
              </div>
              <ul className="space-y-3">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-body text-paper-100 hover:text-brand-400 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <div className="font-mono text-mono-sm text-paper-400 mb-4">
              Legal
            </div>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-body text-paper-100 hover:text-brand-400 transition-colors"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="text-body text-paper-100 hover:text-brand-400 transition-colors"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Anchor strip */}
        <div className="pt-8 border-t border-ink-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4 font-mono text-mono-sm text-paper-400">
          <span>CODEMINDS DIGITAL · v2026.1</span>
          <span className="hidden md:inline">© 2026 — ALL RIGHTS RESERVED</span>
          <span>CHENNAI · INDIA</span>
        </div>
      </div>
    </footer>
  );
}
