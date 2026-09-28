import Image from 'next/image';
import Bento from '@/components/ui/Bento';
import Eyebrow from '@/components/ui/Eyebrow';
import Marquee from '@/components/ui/Marquee';
import Stat from '@/components/ui/Stat';
import Tile from '@/components/ui/Tile';
import { approvedLogos, MIN_LOGOS_FOR_MARQUEE } from '@/data/logos';
import { site } from '@/data/site';

/**
 * Trust strip (replaces the logo wall). Shows a client-logo marquee once
 * enough logos are approved for public use; until then, three stat tiles.
 */
export default function TrustStrip() {
  const showLogos = approvedLogos.length >= MIN_LOGOS_FOR_MARQUEE;

  return (
    <section aria-labelledby="trust-heading" className="pb-8 md:pb-12">
      <div className="container">
        <h2 id="trust-heading" className="sr-only">
          {showLogos ? 'Clients' : 'Track record'}
        </h2>
        {showLogos ? (
          <>
            <Eyebrow index="—" label="Trusted by" className="mb-8 justify-center" />
            <Marquee
              label="Clients"
              items={approvedLogos.map((logo) =>
                logo.src ? (
                  <Image
                    key={logo.name}
                    src={logo.src}
                    alt={logo.name}
                    width={logo.width ?? 120}
                    height={28}
                    className="h-7 w-auto opacity-70 grayscale transition-opacity hover:opacity-100"
                  />
                ) : (
                  <span key={logo.name} className="font-mono text-mono-sm uppercase text-fg-muted">
                    {logo.name}
                  </span>
                ),
              )}
            />
          </>
        ) : (
          <Bento as="ul">
            <Tile as="li" reveal index={0} className="col-span-12 md:col-span-4">
              <p className="font-display text-step-5 font-bold leading-none">
                <Stat value={95} from={40} />+
              </p>
              <p className="mt-3 font-mono text-mono-xs uppercase text-fg-subtle">Lighthouse, by default</p>
            </Tile>
            <Tile as="li" reveal index={1} className="col-span-12 md:col-span-4">
              <p className="font-display text-step-5 font-bold leading-none">
                <Stat value={site.delivery.minWeeks} />–<Stat value={site.delivery.maxWeeks} index={1} />
                <span className="text-step-3"> wk</span>
              </p>
              <p className="mt-3 font-mono text-mono-xs uppercase text-fg-subtle">Kickoff to production</p>
            </Tile>
            <Tile as="li" tone="inverse" reveal index={2} className="col-span-12 md:col-span-4">
              <p className="font-display text-step-5 font-bold leading-none">
                {site.city} <span className="text-accent">→</span>
              </p>
              <p className="mt-3 font-mono text-mono-xs uppercase text-inverse-fg/70">Shipping worldwide</p>
            </Tile>
          </Bento>
        )}
      </div>
    </section>
  );
}
