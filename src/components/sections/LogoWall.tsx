import Image from 'next/image';
import Eyebrow from '@/components/ui/Eyebrow';

type Logo = {
  name: string;
  /** Optional image src — falls back to a wordmark in mono-sm uppercase. */
  src?: string;
  /** Optional explicit width in px. Defaults to 120. */
  width?: number;
  /**
   * True only once the client has signed off on being listed. Unapproved
   * entries are dev-only placeholders and never render in production.
   */
  approved: boolean;
};

/**
 * Drop client logos here. Real assets land as SVG in /public/logos/* and
 * the wordmark fallback disappears automatically once `src` is provided.
 *
 * Per spec: logos render in low-contrast `fg-muted` so they read as
 * trust-markers, not branding noise. The grayscale-ausdata pattern.
 */
const logos: Logo[] = [
  { name: 'Lattice', approved: false },
  { name: 'Vercel', approved: false },
  { name: 'Linear', approved: false },
  { name: 'Notion', approved: false },
  { name: 'Anthropic', approved: false },
  { name: 'Stripe', approved: false },
];

const visibleLogos =
  process.env.NODE_ENV === 'production'
    ? logos.filter((logo) => logo.approved)
    : logos;

export default function LogoWall() {
  // Hide the whole section rather than show an empty "Trusted by" strip.
  if (visibleLogos.length === 0) return null;

  return (
    <section
      aria-labelledby="logo-wall-heading"
      className="bg-canvas border-t border-line py-16 md:py-20"
    >
      <div className="container">
        <Eyebrow
          index="—"
          label="Trusted by"
          className="justify-center mb-10 md:mb-14"
        />

        <h2 id="logo-wall-heading" className="sr-only">
          Trusted by
        </h2>

        <ul className="grid grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-10 items-center justify-items-center">
          {visibleLogos.map((logo) => (
            <li
              key={logo.name}
              className="text-fg-muted hover:text-fg transition-colors duration-300"
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

        <p className="mt-12 md:mt-16 text-center font-mono text-mono-sm text-fg-subtle">
          Some clients are NDA-bound. Real logos drop in here as releases ship.
        </p>
      </div>
    </section>
  );
}
