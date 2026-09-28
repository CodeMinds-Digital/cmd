'use client';

import Image from 'next/image';
import Tilt from '@/components/animations/Tilt';
import ViewTransitionLink from '@/components/animations/ViewTransitionLink';
import type { CaseStub } from '@/data/cases';

type CaseTileProps = {
  data: CaseStub;
  /** Reserved for future staggered entrance — currently unused. */
  index?: number;
};

/**
 * Case tile — no entrance animation, so the tile renders to first paint
 * regardless of hydration / observer / capture-tool timing. Tilt still
 * provides the 3D pointer parallax on hover.
 */
export default function CaseTile({ data }: CaseTileProps) {
  return (
    <Tilt max={6} lift={4}>
      <div className="group relative h-full">
        <Card data={data} />
      </div>
    </Tilt>
  );
}

function Card({ data }: { data: CaseStub }) {
  const isComing = data.status === 'coming';
  const className = `relative block h-full rounded-2xl border border-line bg-surface overflow-hidden ${
    isComing ? 'cursor-default' : 'hover:border-fg-subtle transition-colors'
  }`;

  const inner = (
    <>
      <div
        className="aspect-4/3 relative overflow-hidden bg-surface"
        style={{
          viewTransitionName: isComing ? undefined : `case-cover-${data.slug}`,
        }}
      >
        {data.cover ? (
          <Image
            src={data.cover}
            alt={data.coverAlt ?? data.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 420px"
            className="object-cover"
            priority={false}
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

        {isComing && (
          <div className="absolute inset-0 flex items-center justify-center bg-canvas/50 backdrop-blur-[1px]">
            <span className="font-mono text-mono-sm text-accent-fg px-3 py-1 border border-accent bg-accent rounded-full">
              {data.eta}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 md:p-7">
        <div className="flex flex-wrap gap-x-1.5 gap-y-1 mb-4">
          {data.tags.map((tag, i) => (
            <span
              key={tag}
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle"
            >
              {tag}
              {i < data.tags.length - 1 && (
                <span aria-hidden className="ml-1.5 text-fg-subtle/50">·</span>
              )}
            </span>
          ))}
        </div>

        <h2 className="text-h3 font-semibold text-fg mb-3 leading-tight">
          {data.title}
        </h2>

        <p className="text-body text-fg-muted mb-6">{data.brief}</p>

        {!isComing && (
          <span className="inline-flex items-center gap-2 text-fg group-hover:text-fg font-medium">
            Read case
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
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
          </span>
        )}
      </div>
    </>
  );

  return isComing ? (
    <div className={className}>{inner}</div>
  ) : (
    <ViewTransitionLink href={`/work/${data.slug}`} className={className}>
      {inner}
    </ViewTransitionLink>
  );
}
