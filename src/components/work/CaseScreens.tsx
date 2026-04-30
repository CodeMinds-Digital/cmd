import Image from 'next/image';
import type { CaseScreen } from '@/types/case';

const tonePresets: Record<NonNullable<CaseScreen['tone']>, string> = {
  indigo:
    'radial-gradient(ellipse 65% 55% at 25% 30%, rgba(99,102,241,0.30), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 75%, rgba(6,182,212,0.18), transparent 55%), #0e0e12',
  cyan: 'radial-gradient(ellipse 65% 55% at 75% 25%, rgba(6,182,212,0.32), transparent 60%), radial-gradient(ellipse 55% 45% at 20% 70%, rgba(99,102,241,0.18), transparent 55%), #0e0e12',
  mixed:
    'radial-gradient(ellipse 60% 45% at 30% 30%, rgba(165,180,252,0.28), transparent 60%), radial-gradient(ellipse 55% 50% at 75% 65%, rgba(6,182,212,0.20), transparent 55%), radial-gradient(ellipse 45% 35% at 50% 90%, rgba(99,102,241,0.18), transparent 55%), #0e0e12',
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
                className="relative aspect-[16/10] rounded-2xl border border-ink-600 overflow-hidden"
                style={{
                  background: s.src ? undefined : tonePresets[s.tone ?? 'indigo'],
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
                  className="absolute top-4 left-4 md:top-6 md:left-6 font-mono text-mono-sm text-paper-400 px-2.5 py-1 bg-ink-900/60 rounded-full border border-ink-600 backdrop-blur-md"
                >
                  fig. {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              {s.caption && (
                <p className="mt-4 md:mt-6 text-body text-paper-300 max-w-3xl">
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
