import Link from 'next/link';
import { notFound } from 'next/navigation';
import CaseHero from '@/components/work/CaseHero';
import CaseFacts from '@/components/work/CaseFacts';
import CaseScreens from '@/components/work/CaseScreens';
import CaseMetric from '@/components/work/CaseMetric';
import CasePullquote from '@/components/work/CasePullquote';
import RenderRichText from '@/lib/render-rich-text';
import { previewCase } from '@/lib/cms/preview';

type Params = { slug: string };

/**
 * Auth-gated preview of a case study — bypasses the public `status` filter.
 * Lives under /admin/(authed)/ so the layout's requireUser() guards access.
 *
 * Add `Cache-Control: private` so a preview URL pasted by an editor
 * doesn't get cached at the edge.
 */
export const dynamic = 'force-dynamic';

export default async function PreviewCasePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const data = await previewCase(slug);
  if (!data) notFound();

  return (
    <div className="-mx-8 -my-10 bg-ink-900 text-paper-100">
      <div className="bg-brand-400/10 border-b border-brand-400/30 px-8 py-3 flex items-center justify-between">
        <p className="font-mono text-mono-sm text-brand-400">
          Preview · {data.status} · /work/{data.slug}
        </p>
        <Link
          href={`/admin/caseStudy`}
          className="font-mono text-mono-sm text-paper-200 hover:text-paper-50 transition-colors"
        >
          ← Back to admin
        </Link>
      </div>

      <CaseHero data={data} />
      <CaseFacts data={data} />

      {data.problem && (
        <section className="section-padding pt-0">
          <div className="container max-w-3xl">
            <p className="font-mono text-mono-sm text-brand-400 mb-6">Problem</p>
            <RenderRichText
              doc={data.problem}
              className="text-h3 font-normal text-paper-100 leading-relaxed [&_p]:text-h3 [&_p]:font-normal [&_p]:text-paper-100 [&_p]:leading-relaxed"
            />
          </div>
        </section>
      )}

      {data.screens && <CaseScreens screens={data.screens} />}
      {data.metrics && <CaseMetric metrics={data.metrics} />}
      {data.testimonial && <CasePullquote testimonial={data.testimonial} />}
    </div>
  );
}
