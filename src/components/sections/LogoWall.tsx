import Image from 'next/image';
import SectionEyebrow from '@/components/ui/SectionEyebrow';

type Logo = {
  name: string;
  /** Optional image src — falls back to a wordmark in mono-sm uppercase. */
  src?: string;
  /** Optional explicit width in px. Defaults to 120. */
  width?: number;
};

/**
 * Drop client logos here. Real assets land as SVG in /public/logos/* and
 * the wordmark fallback disappears automatically once `src` is provided.
 *
 * Per spec: logos render in low-contrast `paper-300` so they read as
 * trust-markers, not branding noise. The grayscale-ausdata pattern.
 */
const logos: Logo[] = [
  { name: 'Lattice' },
  { name: 'Vercel' },
  { name: 'Linear' },
  { name: 'Notion' },
  { name: 'Anthropic' },
  { name: 'Stripe' },
];

export default function LogoWall() {
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
              key={logo.name}
              className="text-paper-300/70 hover:text-paper-100 transition-colors duration-300"
            >
              {logo.src ? (
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={logo.width ?? 120}
                  height={28}
                  className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
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
