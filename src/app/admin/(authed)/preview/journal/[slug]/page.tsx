import Link from 'next/link';
import { notFound } from 'next/navigation';
import RenderRichText from '@/lib/render-rich-text';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import { previewPost } from '@/lib/cms/preview';
import { formatDate } from '@/lib/cms/posts';

type Params = { slug: string };

export const dynamic = 'force-dynamic';

export default async function PreviewJournalPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await previewPost(slug);
  if (!post) notFound();

  return (
    <div className="-mx-8 -my-10 bg-ink-900 text-paper-100">
      <div className="bg-brand-400/10 border-b border-brand-400/30 px-8 py-3 flex items-center justify-between">
        <p className="font-mono text-mono-sm text-brand-400">
          Preview · /journal/{post.slug}
        </p>
        <Link
          href="/admin/journalPost"
          className="font-mono text-mono-sm text-paper-200 hover:text-paper-50 transition-colors"
        >
          ← Back to admin
        </Link>
      </div>

      <article>
        <header className="section-padding pt-24 md:pt-32 pb-0">
          <div className="container max-w-3xl">
            <SectionEyebrow
              index="—"
              label={`Journal · ${formatDate(post.date)}`}
              className="mb-8"
            />
            <h1 className="text-h1 md:text-display font-bold text-paper-50 mb-8 text-balance">
              {post.title}
            </h1>
            <p className="text-lead text-paper-200 mb-10">{post.excerpt}</p>
          </div>
        </header>

        <section className="section-padding pt-0">
          <div className="container max-w-3xl">
            {post.body ? (
              <RenderRichText
                doc={post.body}
                className="text-body text-paper-100 leading-relaxed"
              />
            ) : (
              <p className="italic text-paper-300">No body yet.</p>
            )}
          </div>
        </section>
      </article>
    </div>
  );
}
