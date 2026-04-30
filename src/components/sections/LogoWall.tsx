import Image from 'next/image';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import { getClientLogos } from '@/lib/cms/blocks';

export default async function LogoWall() {
  const logos = await getClientLogos();
  if (logos.length === 0) return null;

  return (
    <section
      aria-labelledby="logo-wall-heading"
      className="bg-ink-900 border-t border-ink-700 py-16 md:py-20"
    >
      <div className="container">
        <SectionEyebrow
          index="—"
          label="Trusted by"
          className="justify-center mb-10 md:mb-14"
        />

        <h2 id="logo-wall-heading" className="sr-only">
          Trusted by
        </h2>

        <ul className="grid grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-10 items-center justify-items-center">
          {logos.map((logo) => (
            <li
              key={logo.$id}
              className="text-paper-300/70 hover:text-paper-100 transition-colors duration-300"
            >
              {logo.logoUrl ? (
                <Image
                  src={logo.logoUrl}
                  alt={logo.name}
                  width={120}
                  height={28}
                  className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  unoptimized
                />
              ) : (
                <span className="font-mono text-mono-sm uppercase tracking-[0.18em]">
                  {logo.name}
                </span>
              )}
            </li>
          ))}
        </ul>

        <p className="mt-12 md:mt-16 text-center font-mono text-mono-sm text-paper-400">
          Some clients are NDA-bound. Real logos drop in here as releases ship.
        </p>
      </div>
    </section>
  );
}
