'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { CaseStub } from '@/types/case';

export default function CaseNextLink({
  next,
}: {
  next: CaseStub;
}) {
  return (
    <section className="section-padding border-t border-ink-700">
      <div className="container">
        <p className="font-mono text-mono-sm text-paper-400 mb-8">
          Next case
        </p>

        <Link
          href={`/work/${next.slug}`}
          className="block group"
        >
          <motion.div
            whileHover={{ x: 12 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-baseline justify-between gap-6 md:gap-12"
          >
            <h3 className="text-h2 md:text-display font-bold text-paper-50 group-hover:text-brand-400 transition-colors leading-none tracking-tight max-w-4xl text-balance">
              {next.title}
              <span aria-hidden className="ml-4 md:ml-6 inline-block">→</span>
            </h3>
          </motion.div>

          <div className="mt-6 md:mt-8 font-mono text-mono-sm text-paper-400 flex flex-wrap gap-x-2 gap-y-1">
            {next.tags.map((tag, i) => (
              <span key={tag}>
                {tag}
                {i < next.tags.length - 1 && (
                  <span aria-hidden className="ml-2 text-paper-400/40">·</span>
                )}
              </span>
            ))}
          </div>
        </Link>
      </div>
    </section>
  );
}
