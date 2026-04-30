import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CaseHero from '@/components/work/CaseHero';
import CaseFacts from '@/components/work/CaseFacts';
import CaseScreens from '@/components/work/CaseScreens';
import CaseMetric from '@/components/work/CaseMetric';
import CasePullquote from '@/components/work/CasePullquote';
import CaseNextLink from '@/components/work/CaseNextLink';
import { getCases, getCase, getNextCase } from '@/lib/cms/cases';
import RenderRichText from '@/lib/render-rich-text';

type Params = { slug: string };

export async function generateStaticParams() {
  const cases = await getCases();
  return cases.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCase(slug);
  if (!data) return { title: 'Case Not Found | Codeminds Digital' };

  return {
    title: `${data.title} | Codeminds Digital`,
    description: data.brief,
    openGraph: {
      title: data.title,
      description: data.brief,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(data.title)}&subtitle=${encodeURIComponent(`Case study · ${data.year}`)}`,
        },
      ],
    },
  };
}

export default async function CasePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const data = await getCase(slug);
  if (!data) notFound();

  const next = await getNextCase(slug);
  const isComing = data.status === 'coming';

  return (
    <>
      <Header />
      <main className="bg-ink-900 text-paper-100">
        <CaseHero data={data} />

        {/* For "coming" cases, show only the hero + a quiet CTA back to /work. */}
        {isComing ? (
          <section className="section-padding pt-0">
            <div className="container max-w-3xl">
              <p className="text-lead text-paper-300 italic mb-12">
                Full case write-up lands when this ships. In the meantime,
                browse what is live.
              </p>
              <Link
                href="/work"
                className="inline-flex items-center gap-2 text-paper-200 hover:text-paper-50 transition-colors group"
              >
                <span
                  aria-hidden
                  className="inline-block h-px w-6 bg-paper-400 group-hover:w-10 group-hover:bg-paper-100 transition-all"
                />
                All work
              </Link>
            </div>
          </section>
        ) : (
          <>
            <CaseFacts data={data} />

            {/* Problem */}
            {data.problem && (
              <section className="section-padding pt-0">
                <div className="container max-w-3xl">
                  <p className="font-mono text-mono-sm text-brand-400 mb-6">
                    Problem
                  </p>
                  <RenderRichText
                    doc={data.problem}
                    className="text-h3 font-normal text-paper-100 leading-relaxed [&_p]:text-h3 [&_p]:font-normal [&_p]:text-paper-100 [&_p]:leading-relaxed"
                  />
                </div>
              </section>
            )}

            {/* Approach — numbered editorial rows */}
            {data.approach && data.approach.length > 0 && (
              <section className="section-padding pt-0">
                <div className="container">
                  <p className="font-mono text-mono-sm text-brand-400 mb-12">
                    Approach
                  </p>
                  <ul className="border-t border-ink-600 max-w-5xl">
                    {data.approach.map((step) => (
                      <li
                        key={step.index}
                        className="border-b border-ink-600 grid grid-cols-12 gap-4 md:gap-8 py-8 md:py-10 px-0 md:px-4"
                      >
                        <div className="col-span-2 md:col-span-1">
                          <span className="font-mono text-mono-sm text-brand-400">
                            {step.index}
                          </span>
                        </div>
                        <div className="col-span-10 md:col-span-4">
                          <h3 className="text-h3 font-semibold text-paper-50">
                            {step.title}
                          </h3>
                        </div>
                        <div className="col-span-12 md:col-span-7">
                          <p className="text-body text-paper-200 max-w-2xl">
                            {step.body}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Screens */}
            {data.screens && <CaseScreens screens={data.screens} />}

            {/* Result metric callout */}
            {data.metrics && <CaseMetric metrics={data.metrics} />}

            {/* Pull-quote */}
            {data.testimonial && (
              <CasePullquote testimonial={data.testimonial} />
            )}
          </>
        )}

        {/* Next case */}
        {next && next.slug !== slug && <CaseNextLink next={next} />}

        {/* Bottom return */}
        <section className="section-padding border-t border-ink-700">
          <div className="container">
            <Link
              href="/work"
              className="inline-flex items-center gap-2 text-paper-200 hover:text-paper-50 transition-colors group"
            >
              <span
                aria-hidden
                className="inline-block h-px w-6 bg-paper-400 group-hover:w-10 group-hover:bg-paper-100 transition-all"
              />
              All work
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
