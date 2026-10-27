import Image from 'next/image';
import Eyebrow from '@/components/ui/Eyebrow';
import Marquee from '@/components/ui/Marquee';
import { getApprovedLogos } from '@/lib/cms/repository';

/** Below this many approved logos the stack strip keeps the slot. */
export const MIN_LOGOS_FOR_MARQUEE = 4;

/**
 * Client-logo marquee. Only rendered (by the home page) once at least
 * MIN_LOGOS_FOR_MARQUEE logos are approved (Appwrite `clientLogo.approved`); until then the
 * stack strip holds this slot.
 */
export default async function TrustStrip() {
  const approvedLogos = await getApprovedLogos();
  if (approvedLogos.length < MIN_LOGOS_FOR_MARQUEE) return null;

  return (
    <section aria-labelledby="trust-heading" className="pb-16 md:pb-20">
      <div className="container">
        <h2 id="trust-heading" className="sr-only">
          Clients
        </h2>
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
      </div>
    </section>
  );
}
