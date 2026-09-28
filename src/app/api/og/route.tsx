import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const size = { width: 1200, height: 630 };

// Palette tokens — match the live site (Voltage). Hex because Satori can't
// read CSS variables.
const canvas = '#F2EFE8';
const surface = '#FFFFFF';
const fg = '#111111';
const fgMuted = '#5C5A55';
const accent = '#FF4D00';
const line = 'rgba(17,17,17,0.10)';

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
          gap: 16,
          padding: 48,
          background: canvas,
          color: fg,
          fontFamily:
            "'Space Grotesk', 'Geist', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Headline tile */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 48,
            background: surface,
            border: `1px solid ${line}`,
            borderRadius: 28,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 18,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: fgMuted,
              fontWeight: 500,
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 999, background: accent }} />
            <span>{eyebrow}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div
              style={{
                fontSize: 84,
                fontWeight: 700,
                lineHeight: 0.95,
                letterSpacing: -3,
                maxWidth: 760,
                color: fg,
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: 26, lineHeight: 1.4, color: fgMuted, maxWidth: 740 }}>
              {subtitle}
            </div>
          </div>
        </div>

        {/* Stat + ink tiles */}
        <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: 32,
              background: accent,
              color: fg,
              borderRadius: 28,
            }}
          >
            <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1, letterSpacing: -3 }}>2–4</div>
            <div style={{ fontSize: 18, letterSpacing: 3, textTransform: 'uppercase', marginTop: 8 }}>
              Week delivery
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: 32,
              background: fg,
              color: canvas,
              borderRadius: 28,
              fontSize: 18,
              letterSpacing: 3,
              textTransform: 'uppercase',
              fontFamily:
                "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
            }}
          >
            <span>codeminds.digital</span>
            <span style={{ color: accent }}>Chennai → world</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
