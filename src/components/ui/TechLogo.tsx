import { brandIcons, type BrandIconKey } from '@/components/icons/brand';
import type { GenericGlyph } from '@/data/stack';

// Generic stroke glyphs (after Lucide, ISC) for items whose brand mark can't be used.
const GLYPHS: Record<GenericGlyph, string> = {
  terminal: 'M4 17l6-6-6-6M12 19h8',
  phone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 18h.01',
};

/**
 * Monochrome technology mark + visible label. The mark is decorative
 * (aria-hidden) because the label names it. Inherits colour via currentColor.
 */
export default function TechLogo({
  icon,
  label,
  className,
}: {
  icon: BrandIconKey | GenericGlyph;
  label: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap${className ? ` ${className}` : ''}`}>
      {icon in GLYPHS ? (
        <svg viewBox="0 0 24 24" className="size-6 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
          <path d={GLYPHS[icon as GenericGlyph]} />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-6 shrink-0" fill="currentColor" aria-hidden focusable="false">
          <path d={brandIcons[icon as BrandIconKey].d} />
        </svg>
      )}
      <span>{label}</span>
    </span>
  );
}
