import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import { getPosts, formatDate } from '@/lib/cms/posts';

export const metadata: Metadata = {
  title: 'Journal | Codeminds Digital',
  description:
    'Notes from the studio — pricing, mobile delivery, AI engineering, and the boring infra in between.',
};

export default async function JournalIndexPage() {
  const posts = await getPosts();
  return (
    <>
      <Header />
      <main className="bg-ink-900 text-paper-100">
        <section className="section-padding pt-40 md:pt-56">
          <div className="container">
            <SectionEyebrow index="—" label="Journal" className="mb-8" />
            <h1 className="text-h1 md:text-display font-bold text-paper-50 mb-12 max-w-4xl text-balance">
              Notes from the studio.
            </h1>
            <p className="text-lead text-paper-200 max-w-2xl mb-20 md:mb-32">
              Posts on pricing, mobile delivery, AI engineering, and the boring
              infra in between. Written when we have something worth saying.
            </p>

            <ul className="border-t border-ink-600 max-w-4xl">
              {posts.map((post) => (
                <li key={post.slug} className="border-b border-ink-600">
                  <Link
                    href={`/journal/${post.slug}`}
                    className="grid grid-cols-12 gap-4 md:gap-8 py-8 md:py-10 group hover:bg-ink-800/40 transition-colors px-2 md:px-4 -mx-2 md:-mx-4"
                  >
                    <div className="col-span-12 md:col-span-3 font-mono text-mono-sm text-paper-400 self-start">
                      {formatDate(post.date)}
                    </div>
                    <div className="col-span-12 md:col-span-7">
                      <h2 className="text-h3 font-semibold text-paper-50 group-hover:text-brand-400 transition-colors mb-2">
                        {post.title}
                      </h2>
                      <p className="text-body text-paper-200">{post.excerpt}</p>
                    </div>
                    <div className="col-span-12 md:col-span-2 font-mono text-mono-sm text-paper-400 md:text-right">
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
