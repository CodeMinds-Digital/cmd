import Magnetic from '@/components/animations/Magnetic';
import ChennaiClock from '@/components/islands/ChennaiClock';
import Bento from '@/components/ui/Bento';
import Button from '@/components/ui/Button';
import Highlight from '@/components/ui/Highlight';
import Stat from '@/components/ui/Stat';
import Tile from '@/components/ui/Tile';
import { site } from '@/data/site';

/**
 * Hero — a bento of the studio's key facts (plan §4).
 *
 * Server-rendered. The H1 is plain, visible text so it paints as the LCP
 * element without waiting for JS; only the supporting tiles stagger in.
 * Client islands: <Magnetic> CTA and the live <ChennaiClock>.
 */
export default function Hero() {
  const { minWeeks, maxWeeks } = site.delivery;

  return (
    <section id="home" className="pb-16 pt-24 md:pb-24 md:pt-28">
      <div className="container">
        <Bento className="lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Headline — LCP. Not a reveal tile, so it's never hidden. */}
          <Tile className="col-span-12 flex min-h-[22rem] flex-col justify-between gap-10 lg:col-span-7 lg:row-span-2 lg:min-h-[34rem]">
            <p className="font-mono text-mono-xs uppercase text-fg-subtle">
              {site.name} — software studio
            </p>
            <div>
              <h1 className="text-step-6 font-bold text-fg text-balance">
                Software, built with <Highlight delayMs={350}>care.</Highlight>
              </h1>
              <p className="mt-6 max-w-xl text-step-1 text-fg-muted text-pretty">
                A digital studio for web, mobile, and AI. {minWeeks}–{maxWeeks}-week delivery from{' '}
                {site.city} → worldwide.
              </p>
            </div>
          </Tile>

          {/* Delivery stat */}
          <Tile
            tone="accent"
            reveal
            index={1}
            className="col-span-6 flex flex-col justify-end md:col-span-6 lg:col-span-3"
          >
            <p className="font-display text-step-5 font-bold leading-none tracking-tight">
              <Stat value={minWeeks} index={0} />–<Stat value={maxWeeks} index={1} />
            </p>
            <p className="mt-3 font-mono text-mono-xs uppercase">Week delivery</p>
          </Tile>

          {/* Disciplines */}
          <Tile
            tone="inverse"
            reveal
            index={2}
            className="col-span-6 flex flex-col justify-between gap-6 md:col-span-6 lg:col-span-2"
          >
            <ul className="space-y-1 font-display text-step-2 font-bold">
              {site.disciplines.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <p className="font-mono text-mono-xs uppercase text-accent">→ Worldwide</p>
          </Tile>

          {/* Booking status */}
          <Tile
            reveal
            index={3}
            className="col-span-6 flex flex-col justify-between gap-6 md:col-span-6 lg:col-span-3"
          >
            <p className="flex items-center gap-2 font-mono text-mono-xs uppercase text-fg-subtle">
              <span aria-hidden className="booking-dot size-2 rounded-full bg-accent" />
              Status
            </p>
            <div>
              <p className="font-display text-step-2 font-bold">
                {site.booking.open ? 'Booking new projects' : 'Fully booked'}
              </p>
              {site.booking.detail && (
                <p className="mt-1 text-body">{site.booking.detail}</p>
              )}
            </div>
          </Tile>

          {/* Local time */}
          <Tile
            tone="sunk"
            reveal
            index={4}
            className="col-span-6 flex flex-col justify-between gap-6 md:col-span-6 lg:col-span-2"
          >
            <p className="font-mono text-mono-xs uppercase text-fg-subtle">{site.city}</p>
            <div>
              <ChennaiClock className="block font-display text-step-3 font-bold" />
              <p className="mt-1 font-mono text-mono-xs uppercase text-fg-subtle">UTC+5:30</p>
            </div>
          </Tile>
        </Bento>

        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center md:mt-10">
          <Magnetic>
            <Button href="#contact" size="lg" arrow>
              Start a project
            </Button>
          </Magnetic>
          <Button href="#work" variant="secondary" size="lg">
            See selected work
          </Button>
        </div>

        <div
          aria-hidden
          className="mt-12 flex items-center justify-between border-t border-line pt-5 font-mono text-mono-xs uppercase text-fg-subtle"
        >
          <span>
            {site.name} · {site.version}
          </span>
          <span className="hidden md:inline">
            {site.city} → worldwide
          </span>
          <span>Scroll ↓</span>
        </div>
      </div>
    </section>
  );
}
