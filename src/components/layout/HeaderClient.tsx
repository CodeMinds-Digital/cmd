'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Magnetic from '@/components/animations/Magnetic';

import type { ReactNode } from 'react';
type NavItem = { href: string; label: string };

export default function HeaderClient({
  navItems,
  wordmark,
}: {
  navItems: NavItem[];
  wordmark: ReactNode;
}) {
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

  // Close mobile menu on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <motion.header
      animate={{ y: hidden ? '-100%' : '0%' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? 'bg-ink-900/80 backdrop-blur-xl border-b border-ink-700'
          : 'bg-transparent'
      }`}
    >
      <div className="container flex items-center justify-between h-16 md:h-20">
        {/* Wordmark */}
        <Link
          href="/"
          aria-label="Codeminds Digital — home"
          className="inline-flex items-center text-paper-50 hover:text-brand-400 transition-colors"
        >
          {wordmark}
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
                    ? 'text-paper-50'
                    : 'text-paper-300 hover:text-paper-50'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-4 right-4 -bottom-px h-px bg-brand-400"
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
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-full bg-paper-50 text-ink-900 hover:bg-brand-400 transition-colors group"
            >
              Start a project
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </Magnetic>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-paper-100 p-2 -mr-2"
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
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden bg-ink-900/95 backdrop-blur-xl border-t border-ink-700 overflow-hidden"
            aria-label="Mobile primary"
          >
            <div className="container py-6 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="py-3 text-h3 font-semibold text-paper-100 hover:text-brand-400 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/#contact"
                className="mt-4 inline-flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-full bg-paper-50 text-ink-900 self-start"
              >
                Start a project →
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
