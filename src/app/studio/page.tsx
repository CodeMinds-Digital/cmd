import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SectionEyebrow from '@/components/ui/SectionEyebrow';

export const metadata: Metadata = {
  title: 'Studio | Codeminds Digital',
  description:
    'A small studio shipping web, mobile, and AI products from Chennai. How we work, what we believe, who we are.',
};

const beliefs = [
  {
    index: '01',
    title: 'Ship in weeks, not quarters.',
    body: 'Two-to-four-week sprints. Daily Looms. Weekly demos. We commit to dates and price-fix the work — no surprise invoices, no scope drift.',
  },
  {
    index: '02',
    title: 'Custom, not template.',
    body: 'Every site, app, and AI feature is built from scratch against the codebase you actually have. We do not resell themes.',
  },
  {
    index: '03',
    title: 'You keep the keys.',
    body: 'Your repo, your CI, your domain, your decisions. Hand-off is part of the deliverable, not an upsell.',
  },
  {
    index: '04',
    title: 'One studio, end to end.',
    body: 'The same person who designs your app writes the deploy script. No agency middlemen, no offshore relays.',
  },
];

const stack = [
  { label: 'Web', tools: 'Next.js · React · Tailwind · Postgres · Prisma' },
  { label: 'Mobile', tools: 'SwiftUI · React Native · Expo' },
  { label: 'AI', tools: 'OpenAI · embeddings · pgvector · LangChain' },
  { label: 'Infra', tools: 'Vercel · Cloudflare · Supabase · Turso' },
];

export default function StudioPage() {
  return (
    <>
      <Header />
      <main className="bg-ink-900 text-paper-100">
        {/* Hero */}
        <section className="section-padding pt-40 md:pt-56">
          <div className="container">
            <SectionEyebrow index="—" label="Studio" className="mb-8" />
            <h1 className="text-h1 md:text-display font-bold text-paper-50 mb-12 max-w-5xl text-balance">
              A small studio with{' '}
              <span className="font-serif italic font-normal text-brand-400">
                disproportionate output.
              </span>
            </h1>
            <p className="text-lead text-paper-200 max-w-2xl mb-20 md:mb-32">
              Codeminds Digital is a software studio in Chennai. We design and
              build web, mobile, and AI products for funded startups and other
              studios. Two-to-four-week delivery. No templates, no offshore
              relays, no quarterly retainers you forgot you signed.
            </p>
          </div>
        </section>

        {/* Beliefs */}
        <section className="section-padding pt-0">
          <div className="container">
            <SectionEyebrow index="01" label="What we believe" className="mb-12" />
            <ul className="border-t border-ink-600 max-w-5xl">
              {beliefs.map((b) => (
                <li
                  key={b.index}
                  className="border-b border-ink-600 grid grid-cols-12 gap-4 md:gap-8 py-8 md:py-12 px-0 md:px-4"
                >
                  <div className="col-span-2 md:col-span-1">
                    <span className="font-mono text-mono-sm text-brand-400">
                      {b.index}
                    </span>
                  </div>
                  <div className="col-span-10 md:col-span-5">
                    <h3 className="text-h3 font-semibold text-paper-50">
                      {b.title}
                    </h3>
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <p className="text-body text-paper-200 max-w-xl">{b.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Stack */}
        <section className="section-padding pt-0">
          <div className="container">
            <SectionEyebrow index="02" label="Stack we ship" className="mb-12" />
            <ul className="border-t border-ink-600 max-w-3xl">
              {stack.map((s) => (
                <li
                  key={s.label}
                  className="border-b border-ink-600 flex items-baseline justify-between py-5"
                >
                  <span className="font-mono text-mono-sm text-paper-400">
                    {s.label}
                  </span>
                  <span className="text-body text-paper-100">{s.tools}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="section-padding border-t border-ink-700">
          <div className="container">
            <h2 className="text-h2 md:text-h1 font-bold text-paper-50 mb-8 max-w-3xl text-balance">
              Want to{' '}
              <span className="font-serif italic font-normal text-brand-400">
                make something?
              </span>
            </h2>
            <Link
              href="/#contact"
              className="btn-primary btn-lg group inline-flex items-center"
            >
              Start a project
              <svg
                className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
