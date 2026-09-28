/**
 * Voltage highlight chip — the orange rounded block behind one key phrase per
 * section ("care.", "what we ship."). Replaces the old Instrument Serif
 * italic accent. Text on the accent fill always uses `accent-fg` (#111) so it
 * passes AA at any size.
 *
 * `highlightClass` is exported for components that take a className instead
 * of children (e.g. <SplitText className={highlightClass}>).
 */
export const highlightClass =
  'rounded-[0.14em] bg-accent px-[0.12em] text-accent-fg box-decoration-clone';

export default function Highlight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={className ? `${highlightClass} ${className}` : highlightClass}>
      {children}
    </span>
  );
}
