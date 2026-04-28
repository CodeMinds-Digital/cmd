'use client';

import Link, { type LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import React, { useCallback } from 'react';

type Props = LinkProps & {
  children: React.ReactNode;
  className?: string;
  /** Falls back to standard navigation if View Transitions isn't supported. */
  href: string;
};

/**
 * Drop-in `next/link` replacement that wraps the navigation in
 * `document.startViewTransition()` so any element tagged with
 * `view-transition-name` morphs across routes. Browsers without the API
 * (and users with `prefers-reduced-motion: reduce`) fall through to a
 * standard navigation — no polyfill, no jank.
 */
export default function ViewTransitionLink({
  href,
  children,
  className,
  prefetch,
  scroll,
  replace,
  ...rest
}: Props) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Honor middle-click, modifier-click, target=_blank, etc.
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const supportsVT =
        typeof document !== 'undefined' &&
        'startViewTransition' in document &&
        !prefersReducedMotion;

      if (!supportsVT) return; // standard <Link> navigation handles it

      e.preventDefault();
      // Defer to next microtask so prefetch has a chance to settle.
      (document as Document & {
        startViewTransition: (cb: () => void) => unknown;
      }).startViewTransition(() => {
        if (replace) router.replace(href, { scroll });
        else router.push(href, { scroll });
      });
    },
    [href, prefersReducedMotion, replace, router, scroll],
  );

  return (
    <Link
      href={href}
      prefetch={prefetch}
      scroll={scroll}
      replace={replace}
      onClick={handleClick}
      className={className}
      {...rest}
    >
      {children}
    </Link>
  );
}
