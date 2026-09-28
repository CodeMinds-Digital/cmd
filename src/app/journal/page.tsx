import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Eyebrow from '@/components/ui/Eyebrow';
import { posts, formatDate } from '@/data/posts';

export const metadata: Metadata = {
  title: 'Journal | Codeminds Digital',
  description:
    'Notes from the studio — pricing, mobile delivery, AI engineering, and the boring infra in between.',
};

export default function JournalIndexPage() {
  return (
    <>
      <Header active="/journal" />
      <main className="bg-canvas text-fg">
        <section className="section-padding pt-40 md:pt-56">
          <div className="container">
            <Eyebrow index="—" label="Journal" className="mb-8" />
            <h1 className="text-h1 md:text-display font-bold text-fg mb-12 max-w-4xl text-balance">
              Notes from the studio.
            </h1>
            <p className="text-lead text-fg-muted max-w-2xl mb-20 md:mb-32">
              Posts on pricing, mobile delivery, AI engineering, and the boring
              infra in between. Written when we have something worth saying.
            </p>

            <ul className="border-t border-line max-w-4xl">
              {posts.map((post) => (
                <li key={post.slug} className="border-b border-line">
                  <Link
                    href={`/journal/${post.slug}`}
                    className="grid grid-cols-12 gap-4 md:gap-8 py-8 md:py-10 group hover:bg-surface-sunk/60 transition-colors px-2 md:px-4 -mx-2 md:-mx-4"
                  >
                    <div className="col-span-12 md:col-span-3 font-mono text-mono-sm text-fg-subtle self-start">
                      {formatDate(post.date)}
                    </div>
                    <div className="col-span-12 md:col-span-7">
                      <h2 className="text-h3 font-semibold text-fg group-hover:text-accent-ink transition-colors mb-2">
                        {post.title}
                      </h2>
                      <p className="text-body text-fg-muted">{post.excerpt}</p>
                    </div>
                    <div className="col-span-12 md:col-span-2 font-mono text-mono-sm text-fg-subtle md:text-right">
                      {post.readingTime}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
