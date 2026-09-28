import Image from 'next/image';
import ViewTransitionLink from '@/components/animations/ViewTransitionLink';
import Bento from '@/components/ui/Bento';
import Chip from '@/components/ui/Chip';
import Icon from '@/components/icons/Icon';
import Tile from '@/components/ui/Tile';
import type { ChipTone } from '@/components/ui/Chip';
import type { CaseStub } from '@/data/cases';

/**
 * Selected-work bento (plan §4): live cases as large feature tiles, cases in
 * progress as compact sunk tiles stacked beside them.
 */
export default function CaseBento({ cases }: { cases: CaseStub[] }) {
  const live = cases.filter((c) => c.status === 'live');
  const coming = cases.filter((c) => c.status === 'coming');

  return (
    <Bento>
      {live.map((c, i) => (
        <LiveCaseTile key={c.slug} data={c} index={i} />
      ))}
      <div className="col-span-12 grid gap-bento lg:col-span-4 lg:grid-rows-2">
        {coming.map((c, i) => (
          <ComingCaseTile key={c.slug} data={c} index={live.length + i} />
        ))}
      </div>
    </Bento>
  );
}

function Tags({ tags, tone = 'sunk' }: { tags: string[]; tone?: ChipTone }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Stack">
      {tags.map((t) => (
        <li key={t}>
          <Chip tone={tone}>{t}</Chip>
        </li>
      ))}
    </ul>
  );
}

function LiveCaseTile({ data, index }: { data: CaseStub; index: number }) {
  const metrics = data.metrics?.slice(0, 2) ?? [];
  return (
    <Tile
      as="article"
      interactive
      reveal
      index={index}
      className="group col-span-12 flex flex-col gap-6 lg:col-span-8"
    >
      {data.cover && (
        <div
          className="relative aspect-16/10 overflow-hidden rounded-inner border border-line bg-surface-sunk"
          style={{ viewTransitionName: `case-cover-${data.slug}` }}
        >
          <Image
            src={data.cover}
            alt={data.coverAlt ?? ''}
            fill
            sizes="(max-width: 1024px) 100vw, 800px"
            className="object-cover transition-transform duration-700 ease-expo-out group-hover:scale-[1.02]"
            unoptimized={data.cover.endsWith('.svg')}
          />
        </div>
      )}

      <div className="flex flex-col gap-5 @xl:flex-row @xl:items-end @xl:justify-between">
        <div className="max-w-xl">
          <p className="mb-2 font-mono text-mono-xs uppercase text-fg-subtle">
            {data.year} · {data.client ?? 'Confidential'}
          </p>
          <h3 className="text-step-3 font-bold text-fg">
            {/* Stretched link: the whole tile is the hit area, one accessible name. */}
            <ViewTransitionLink
              href={`/work/${data.slug}`}
              className="text-fg after:absolute after:inset-0 after:rounded-tile after:content-[''] hover:text-fg"
            >
              {data.title}
            </ViewTransitionLink>
          </h3>
          <p className="mt-3 text-step-0 text-fg-muted">{data.brief}</p>
        </div>
        <span
          aria-hidden
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-inverse px-5 py-3 text-sm font-medium text-inverse-fg transition-colors group-hover:bg-accent group-hover:text-accent-fg @xl:self-auto"
        >
          Read case
          <Icon name="arrow-right" className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {metrics.map((m) => (
          <Chip key={m.label} tone="accent">
            {m.label} {m.value}
          </Chip>
        ))}
        <Tags tags={data.tags} />
      </div>
    </Tile>
  );
}

function ComingCaseTile({ data, index }: { data: CaseStub; index: number }) {
  return (
    <Tile as="article" tone="sunk" reveal index={index} className="flex flex-col justify-between gap-6">
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <Chip tone="accent">{data.eta ?? 'In progress'}</Chip>
          <span className="font-mono text-mono-xs uppercase text-fg-subtle">{data.year}</span>
        </div>
        <h3 className="text-step-2 font-bold text-fg">{data.title}</h3>
        <p className="mt-2 text-body">{data.brief}</p>
      </div>
      {/* Sunk chips would vanish on a sunk tile — outline them instead. */}
      <Tags tags={data.tags} tone="outline" />
    </Tile>
  );
}
