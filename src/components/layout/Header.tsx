'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { m, AnimatePresence } from 'motion/react';
import Magnetic from '@/components/animations/Magnetic';

const navItems = [
  { href: '/work', label: 'Work' },
  { href: '/studio', label: 'Studio' },
  { href: '/journal', label: 'Journal' },
];

export default function Header() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      // Hide on scroll down past the hero, show on scroll up.
      if (y > 200 && y > lastY) setHidden(true);
      else setHidden(false);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on navigation — adjust state during render instead of
  // in an effect (https://react.dev/learn/you-might-not-need-an-effect).
  const [menuPath, setMenuPath] = useState(pathname);
  if (pathname !== menuPath) {
    setMenuPath(pathname);
    setMobileOpen(false);
  }

  return (
    <m.header
      animate={{ y: hidden ? '-100%' : '0%' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? 'bg-canvas/80 backdrop-blur-xl border-b border-line'
          : 'bg-transparent'
      }`}
    >
      <div className="container flex items-center justify-between h-16 md:h-20">
        {/* Wordmark */}
        <Link
          href="/"
          className="font-semibold text-fg tracking-tight hover:text-accent-ink transition-colors"
        >
          Codeminds<span className="text-fg-subtle font-mono mx-1">·</span>
          <span className="font-normal text-fg-subtle">Digital</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm transition-colors relative ${
                  active
                    ? 'text-fg'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-4 right-4 -bottom-px h-px bg-accent"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="hidden md:block">
          <Magnetic>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-full bg-inverse text-inverse-fg hover:bg-accent hover:text-accent-fg transition-colors group"
            >
              Start a project
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </Magnetic>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-fg p-2 -mr-2"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <m.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden bg-canvas/95 backdrop-blur-xl border-t border-line overflow-hidden"
            aria-label="Mobile primary"
          >
            <div className="container py-6 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="py-3 text-h3 font-semibold text-fg hover:text-accent-ink transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/#contact"
                className="mt-4 inline-flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-full bg-inverse text-inverse-fg self-start"
              >
                Start a project →
              </Link>
            </div>
          </m.nav>
        )}
      </AnimatePresence>
    </m.header>
  );
}
