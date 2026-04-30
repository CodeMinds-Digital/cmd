import Link from 'next/link';
import Image from 'next/image';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import type { CaseStub } from '@/types/case';

export default function CaseHero({ data }: { data: CaseStub }) {
  return (
    <section className="section-padding pt-40 md:pt-56 pb-0">
      <div className="container">
        <SectionEyebrow
          index="—"
          label={`${data.year} · ${data.client ?? 'Confidential client'}`}
          className="mb-8"
        />
        <h1 className="text-h1 md:text-display font-bold text-paper-50 mb-8 max-w-5xl text-balance">
          {data.title.includes(' for ') ? (
            <>
              {data.title.split(' for ')[0]}{' '}
              <span className="font-serif italic font-normal text-brand-400">
                for {data.title.split(' for ')[1]}
              </span>
            </>
          ) : (
            data.title
          )}
        </h1>
        <p className="text-lead text-paper-200 max-w-2xl mb-12">{data.brief}</p>

        {data.liveUrl && (
          <Link
            href={data.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-paper-100 hover:text-brand-400 font-medium transition-colors group mb-12 md:mb-16"
          >
            Visit live site
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        )}

        {/* Cover plate */}
        <div
          className="aspect-[16/9] rounded-3xl border border-ink-600 bg-ink-800 overflow-hidden mb-20 md:mb-32 relative"
          style={{
            viewTransitionName: `case-cover-${data.slug}`,
          }}
        >
          {data.cover ? (
            <Image
              src={data.cover}
              alt={data.coverAlt ?? data.title}
              fill
              sizes="(max-width: 1280px) 92vw, 1200px"
              className="object-cover"
              priority
              unoptimized={data.cover.endsWith('.svg')}
            />
          ) : (
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 70% 60% at 30% 30%, rgba(99,102,241,0.30), transparent 60%), radial-gradient(ellipse 60% 50% at 75% 70%, rgba(6,182,212,0.22), transparent 55%), #101013',
              }}
            />
          )}

          {data.status === 'coming' && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-900/40 backdrop-blur-[1px]">
              <span className="font-mono text-mono-sm text-paper-50 px-4 py-1.5 border border-paper-50/30 bg-ink-900/60 rounded-full">
                {data.eta}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
