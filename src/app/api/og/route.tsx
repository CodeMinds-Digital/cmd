import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const size = { width: 1200, height: 630 };

// Palette tokens — match the live site (Plasma Indigo).
const ink = '#0a0a0c';
const paper50 = '#f5f5f7';
const paper300 = '#a5a5b4';
const paper400 = '#6b6c8a';
const brand400 = '#a5b4fc';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') ?? 'Software, built with care.';
  const subtitle =
    searchParams.get('subtitle') ??
    'Web · Mobile · AI · 2–4 weeks · Chennai → worldwide';
  const eyebrow = searchParams.get('eyebrow') ?? 'Codeminds Digital';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: `radial-gradient(ellipse 60% 50% at 25% 30%, rgba(99,102,241,0.40), transparent 60%), radial-gradient(ellipse 55% 45% at 80% 75%, rgba(6,182,212,0.30), transparent 60%), ${ink}`,
          color: paper50,
          fontFamily:
            "'Geist', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Top row — eyebrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 18,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: paper300,
            fontWeight: 500,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: brand400,
            }}
          />
          <span>{eyebrow}</span>
        </div>

        {/* Headline + subline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              lineHeight: 0.95,
              letterSpacing: -3,
              maxWidth: 1000,
              color: paper50,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              color: paper300,
              maxWidth: 950,
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Bottom anchor strip — matches the live site's mono caption */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 18,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: paper400,
            fontFamily:
              "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
          }}
        >
          <span>codeminds.digital</span>
          <span>v2026.1 · Chennai · India</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
