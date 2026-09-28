import Image from 'next/image';
import type { CaseScreen } from '@/data/cases';

const glow = (pct: number) => `color-mix(in oklab, var(--color-accent) ${pct}%, transparent)`;

const tonePresets: Record<NonNullable<CaseScreen['tone']>, string> = {
  paper: `radial-gradient(ellipse 65% 55% at 25% 30%, ${glow(22)}, transparent 60%), var(--color-surface-sunk)`,
  ink: `radial-gradient(ellipse 65% 55% at 75% 25%, ${glow(38)}, transparent 60%), var(--color-inverse)`,
  mixed: `radial-gradient(ellipse 60% 45% at 30% 30%, ${glow(18)}, transparent 60%), radial-gradient(ellipse 55% 50% at 75% 65%, ${glow(12)}, transparent 55%), var(--color-surface)`,
};

export default function CaseScreens({ screens }: { screens: CaseScreen[] }) {
  if (!screens?.length) return null;

  return (
    <section className="section-padding pt-0">
      <div className="container">
        <ul className="space-y-12 md:space-y-20 max-w-6xl mx-auto">
          {screens.map((s, i) => (
            <li key={i}>
              <div
                className="relative aspect-16/10 rounded-2xl border border-line overflow-hidden"
                style={{
                  background: s.src ? undefined : tonePresets[s.tone ?? 'paper'],
                }}
              >
                {s.src && (
                  <Image
                    src={s.src}
                    alt={s.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
                    className="object-cover"
                    unoptimized={s.src.endsWith('.svg')}
                  />
                )}
                {/* Mono index badge */}
                <span
                  aria-hidden
                  className="absolute top-4 left-4 md:top-6 md:left-6 font-mono text-mono-sm text-fg-muted px-2.5 py-1 bg-surface/80 rounded-full border border-line backdrop-blur-md"
                >
                  fig. {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              {s.caption && (
                <p className="mt-4 md:mt-6 text-body text-fg-muted max-w-3xl">
                  {s.caption}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
