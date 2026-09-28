'use client';

import Link from 'next/link';
import { m } from 'motion/react';
import type { CaseStub } from '@/data/cases';

export default function CaseNextLink({
  next,
}: {
  next: CaseStub;
}) {
  return (
    <section className="section-padding border-t border-line">
      <div className="container">
        <p className="font-mono text-mono-sm text-fg-subtle mb-8">
          Next case
        </p>

        <Link
          href={`/work/${next.slug}`}
          className="block group"
        >
          <m.div
            whileHover={{ x: 12 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-baseline justify-between gap-6 md:gap-12"
          >
            <h3 className="text-h2 md:text-display font-bold text-fg group-hover:text-accent-ink transition-colors leading-none tracking-tight md:leading-(--text-display--line-height) md:tracking-(--text-display--letter-spacing) max-w-4xl text-balance">
              {next.title}
              <span aria-hidden className="ml-4 md:ml-6 inline-block">→</span>
            </h3>
          </m.div>

          <div className="mt-6 md:mt-8 font-mono text-mono-sm text-fg-subtle flex flex-wrap gap-x-2 gap-y-1">
            {next.tags.map((tag, i) => (
              <span key={tag}>
                {tag}
                {i < next.tags.length - 1 && (
                  <span aria-hidden className="ml-2 text-fg-subtle/50">·</span>
                )}
              </span>
            ))}
          </div>
        </Link>
      </div>
    </section>
  );
}
