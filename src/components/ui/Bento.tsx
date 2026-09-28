import type React from 'react';

/**
 * 12-column bento grid with the tight Voltage gap (`--spacing-bento`).
 * Children are usually <Tile>s that set their own `col-span-*` / `row-span-*`.
 *
 * The grid is one in-view group: tiles with `reveal` (i.e. `.tile-in`) stagger
 * in together when the grid enters the viewport, ordered by their `index`.
 */
export default function Bento({
  children,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'ul';
}) {
  return (
    <Tag
      className={`grid grid-cols-12 gap-bento${className ? ` ${className}` : ''}`}
      data-inview=""
    >
      {children}
    </Tag>
  );
}
