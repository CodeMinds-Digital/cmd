import Link from 'next/link';
import Magnetic from '@/components/animations/Magnetic';
import HeaderController from '@/components/islands/HeaderController';
import Button from '@/components/ui/Button';
import { site } from '@/data/site';

type HeaderProps = {
  /** Nav href of the current section, e.g. "/work". */
  active?: string;
  /** True when the current URL *is* `active` (vs. a page inside it). */
  activeIsPage?: boolean;
};

/**
 * Site header. Server-rendered; behaviour lives in CSS + one small island:
 * - Condenses from transparent into a floating white pill over the first
 *   80px of scroll (`.condense-on-scroll` → `--condense`, styles/motion.css).
 * - Hides on scroll down / shows on scroll up (<HeaderController>).
 * - Mobile menu is a native popover: Esc, light-dismiss and focus return
 *   come from the browser.
 */
export default function Header({ active, activeIsPage = true }: HeaderProps) {
  const current = (href: string) =>
    href === active ? (activeIsPage ? ('page' as const) : ('true' as const)) : undefined;

  return (
    <header data-site-header className="site-header condense-on-scroll fixed inset-x-0 top-0 z-50">
      <div className="container">
        <div className="site-header-bar flex h-14 items-center justify-between rounded-full md:h-16">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2 font-display text-lg font-bold tracking-tight text-fg hover:text-fg"
          >
            <span aria-hidden className="size-2.5 rounded-full bg-accent" />
            codeminds
            <span className="sr-only"> digital — home</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current(item.href)}
                className="relative rounded-full px-4 py-2 text-sm text-fg-muted transition-colors hover:text-fg aria-[current]:text-fg"
              >
                {item.label}
                {item.href === active && (
                  <span aria-hidden className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-accent" />
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Magnetic>
              <Button href="/#contact" size="sm" arrow>
                Start a project
              </Button>
            </Magnetic>
          </div>

          <button
            type="button"
            popoverTarget="site-menu"
            className="-mr-2 grid size-11 place-items-center rounded-full text-fg md:hidden"
            aria-label="Open menu"
          >
            <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu — native popover (top layer, Esc + light dismiss built in). */}
      <div id="site-menu" popover="auto" className="menu-popover md:hidden" aria-label="Menu">
        <div className="mb-6 flex items-center justify-between">
          <span className="font-mono text-mono-xs uppercase text-fg-subtle">Menu</span>
          <button
            type="button"
            popoverTarget="site-menu"
            popoverTargetAction="hide"
            className="-mr-2 grid size-11 place-items-center rounded-full text-fg"
            aria-label="Close menu"
          >
            <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav aria-label="Mobile primary" className="flex flex-col">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current(item.href)}
              className="border-b border-line py-4 font-display text-step-4 font-bold text-fg hover:text-accent-ink aria-[current]:text-accent-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Button href="/#contact" size="lg" arrow className="mt-8 w-full">
          Start a project
        </Button>
      </div>

      <HeaderController />
    </header>
  );
}
