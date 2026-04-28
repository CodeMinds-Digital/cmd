import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import CaseTile from '@/components/work/CaseTile';
import { cases } from '@/data/cases';

export const metadata: Metadata = {
  title: 'Work | Codeminds Digital',
  description:
    'Selected case studies — web platforms, mobile apps, and AI integrations shipped in 2–4 weeks.',
};

export default function WorkIndexPage() {
  return (
    <>
      <Header />
      <main className="bg-ink-900 text-paper-100">
        <section className="section-padding pt-40 md:pt-56">
          <div className="container">
            <SectionEyebrow index="—" label="All Work" className="mb-8" />
            <h1 className="text-h1 md:text-display font-bold text-paper-50 mb-12 max-w-4xl text-balance">
              Every project we&apos;ve shipped this year.
            </h1>
            <p className="text-lead text-paper-200 max-w-2xl mb-20 md:mb-32">
              Three cases below. One live, two shipping in May 2026. New work
              lands here as it ships — no marketing, no fluff.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {cases.map((c, i) => (
                <CaseTile key={c.slug} data={c} index={i} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
