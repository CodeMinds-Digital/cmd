'use client';

import Link from 'next/link';
import SplitText from '@/components/animations/SplitText';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import CaseTile from '@/components/work/CaseTile';
import { cases } from '@/data/cases';
import { highlightClass } from '@/components/ui/Highlight';

export default function SelectedWork() {
  return (
    <section
      id="work"
      className="section-padding relative bg-canvas overflow-hidden"
    >
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16 md:mb-24">
          <div>
            <SectionEyebrow index="01" label="Selected Work" className="mb-6" />
            <h2 className="text-h2 md:text-h1 font-bold text-fg max-w-2xl text-balance">
              <SplitText>Three cases that show </SplitText>
              <SplitText
                className={highlightClass}
                delay={0.4}
              >
                what we ship.
              </SplitText>
            </h2>
          </div>
          <Link
            href="/work"
            className="text-fg-muted hover:text-fg transition-colors inline-flex items-center gap-2 group whitespace-nowrap"
          >
            All work
            <span
              aria-hidden
              className="inline-block h-px w-6 bg-fg-subtle group-hover:w-10 group-hover:bg-fg transition-all"
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {cases.map((c, i) => (
            <CaseTile key={c.slug} data={c} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
