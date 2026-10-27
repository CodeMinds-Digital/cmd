import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Eyebrow from '@/components/ui/Eyebrow';
import { formatDate } from '@/lib/format-date';
import { getPost, getPosts } from '@/lib/cms/repository';
import { renderRichText } from '@/lib/cms/rich-text';
import { BUCKETS, fileViewUrl } from '@codeminds/cms/assets';

type Params = { slug: string };

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post Not Found | Codeminds Digital' };

  const description = post.seoDescription ?? post.excerpt;
  return {
    title: `${post.seoTitle ?? post.title} | Codeminds Digital`,
    description,
    openGraph: {
      title: post.seoTitle ?? post.title,
      description,
      type: 'article',
      publishedTime: post.date,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(post.title)}&subtitle=${encodeURIComponent(`Journal · ${formatDate(post.date)}`)}`,
        },
      ],
    },
  };
}

export default async function JournalPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const posts = await getPosts();
  const idx = posts.findIndex((p) => p.slug === slug);
  const next = posts[idx + 1] ?? posts[0];

  return (
    <>
      <Header active="/journal" activeIsPage={false} />
      <main id="main" className="bg-canvas text-fg">
        <article>
          <header className="section-padding pt-40 md:pt-56 pb-0">
            <div className="container max-w-3xl">
              <Eyebrow
                index="—"
                label={`Journal · ${formatDate(post.date)}`}
                className="mb-8"
              />
              <h1 className="text-step-5 font-bold text-fg mb-8 text-balance">
                {post.title}
              </h1>
              <p className="text-lead text-fg-muted mb-10">{post.excerpt}</p>
              <div className="flex flex-wrap gap-x-2 gap-y-1 mb-16 md:mb-20">
                {post.tags.map((t, i) => (
                  <span
                    key={t}
                    className="font-mono text-mono-sm text-fg-subtle"
                  >
                    {t}
                    {i < post.tags.length - 1 && (
                      <span aria-hidden className="ml-2 text-fg-subtle/50">
                        ·
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </header>

          <section className="section-padding pt-0">
            <div className="container max-w-3xl">
              {post.cover && (
                <div className="relative mb-12 aspect-[16/9] overflow-hidden rounded-2xl border border-line">
                  <Image src={post.cover.src} alt={post.cover.alt ?? ''} fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
                </div>
              )}
              <div className="text-body text-fg space-y-6 leading-relaxed">
                {post.doc ? (
                  renderRichText(post.doc, { fileUrl: (id) => fileViewUrl(BUCKETS.publicAssets, id) })
                ) : post.body ? (
                  <p>{post.body}</p>
                ) : (
                  <p className="italic text-fg-muted">
                    Long-form post lands here as MDX in a future polish pass.
                  </p>
                )}
              </div>
            </div>
          </section>
        </article>

        <section className="section-padding border-t border-line">
          <div className="container max-w-3xl flex flex-col md:flex-row md:items-baseline md:justify-between gap-6">
            <Link
              href="/journal"
              className="inline-flex min-h-11 items-center gap-2 text-fg-muted hover:text-fg transition-colors group"
            >
              <span
                aria-hidden
                className="inline-block h-px w-6 bg-fg-subtle group-hover:w-10 group-hover:bg-fg transition-all"
              />
              All posts
            </Link>

            {next.slug !== slug && (
              <Link
                href={`/journal/${next.slug}`}
                className="group block max-w-md"
              >
                <span className="font-mono text-mono-sm text-fg-subtle mb-2 block">
                  Next post
                </span>
                <span className="text-h3 font-semibold text-fg group-hover:text-accent-ink transition-colors">
                  {next.title} →
                </span>
              </Link>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
