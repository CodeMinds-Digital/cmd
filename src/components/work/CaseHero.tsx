import Link from 'next/link';
import Image from 'next/image';
import Eyebrow from '@/components/ui/Eyebrow';
import type { CaseStub } from '@/data/cases';
import Highlight from '@/components/ui/Highlight';

export default function CaseHero({ data }: { data: CaseStub }) {
  return (
    <section className="section-padding pt-40 md:pt-56 pb-0">
      <div className="container">
        <Eyebrow
          index="—"
          label={`${data.year} · ${data.client ?? 'Confidential client'}`}
          className="mb-8"
        />
        <h1 className="text-step-5 font-bold text-fg mb-8 max-w-5xl text-balance">
          {data.title.includes(' for ') ? (
            <>
              {data.title.split(' for ')[0]}{' '}
              <Highlight>
                for {data.title.split(' for ')[1]}
              </Highlight>
            </>
          ) : (
            data.title
          )}
        </h1>
        <p className="text-lead text-fg-muted max-w-2xl mb-12">{data.brief}</p>

        {data.liveUrl && (
          <Link
            href={data.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-fg hover:text-accent-ink font-medium transition-colors group mb-12 md:mb-16"
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
          className="aspect-video rounded-3xl border border-line bg-surface overflow-hidden mb-20 md:mb-32 relative"
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
                  `radial-gradient(ellipse 70% 60% at 30% 30%, color-mix(in oklab, var(--color-accent) 24%, transparent), transparent 60%), var(--color-surface-sunk)`,
              }}
            />
          )}

          {data.status === 'coming' && (
            <div className="absolute inset-0 flex items-center justify-center bg-canvas/50 backdrop-blur-[1px]">
              <span className="font-mono text-mono-sm text-accent-fg px-4 py-1.5 border border-accent bg-accent rounded-full">
                {data.eta}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
