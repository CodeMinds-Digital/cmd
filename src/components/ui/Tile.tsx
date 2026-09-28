import type React from 'react';
import Link from 'next/link';

export type TileTone = 'surface' | 'sunk' | 'accent' | 'inverse' | 'inverse-raised';

const TONES: Record<TileTone, string> = {
  surface: 'bg-surface text-fg border border-line',
  sunk: 'bg-surface-sunk text-fg border border-line',
  accent: 'bg-accent text-accent-fg border border-accent',
  inverse: 'bg-inverse text-inverse-fg border border-inverse',
  // A tile sitting on an inverse (black) section.
  'inverse-raised': 'bg-inverse-fg/[0.06] text-inverse-fg border border-inverse-fg/10',
};

type TileProps = {
  children: React.ReactNode;
  className?: string;
  /** Fill. Default `surface` (white). */
  tone?: TileTone;
  /** Hover lift + pointer-following glow (pointer: fine only). */
  interactive?: boolean;
  /** Stagger in with the parent <Bento> when it enters view. */
  reveal?: boolean;
  /** Position in the stagger sequence (0-based). */
  index?: number;
  /** Render as a link — the whole tile becomes the hit area. */
  href?: string;
  as?: 'div' | 'li' | 'article';
  style?: React.CSSProperties;
};

/**
 * Bento tile. A container-query root (`@container`), so its content can
 * adapt to the tile's width with `@sm:` / `@md:` variants instead of the
 * viewport.
 */
export default function Tile({
  children,
  className,
  tone = 'surface',
  interactive = false,
  reveal = false,
  index = 0,
  href,
  as: Tag = 'div',
  style,
}: TileProps) {
  const classes = [
    '@container relative overflow-hidden rounded-tile p-5 md:p-7',
    TONES[tone],
    interactive && 'tile-interactive tile-glow',
    reveal && 'tile-in',
    href && 'block focus-visible:outline-offset-4',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const mergedStyle = { '--i': index, ...style } as React.CSSProperties;
  const glow = interactive ? { 'data-glow': '' } : {};

  if (href) {
    return (
      <Link href={href} className={classes} style={mergedStyle} {...glow}>
        {children}
      </Link>
    );
  }
  return (
    <Tag className={classes} style={mergedStyle} {...glow}>
      {children}
    </Tag>
  );
}
