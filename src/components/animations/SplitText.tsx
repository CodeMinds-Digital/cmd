import React from 'react';

type SplitTextProps = {
  /**
   * Either a plain string (split into words) or an array of strings and
   * inline elements. Inline elements are treated as one atomic word so a
   * styled accent (e.g. a highlight chip) can ride inside the same
   * staggered reveal.
   */
  children: React.ReactNode;
  className?: string;
  /** Stagger between words in seconds. Default 0.05. */
  stagger?: number;
  /** Animation duration in seconds. Default 0.8. */
  duration?: number;
  /** Delay before the first word in seconds. */
  delay?: number;
  /**
   * Reveal when scrolled into view instead of on load (default false).
   * On-load reveals are pure CSS; in-view reveals are triggered by
   * <MotionRuntime> (see styles/motion.css).
   */
  inView?: boolean;
};

type Segment = { kind: 'word'; content: React.ReactNode } | { kind: 'space' };

function flatten(node: React.ReactNode): Segment[] {
  if (node == null || node === false || node === true) return [];
  if (typeof node === 'string' || typeof node === 'number') {
    const parts = String(node).split(/(\s+)/);
    return parts
      .filter((p) => p.length > 0)
      .map<Segment>((p) =>
        /^\s+$/.test(p) ? { kind: 'space' } : { kind: 'word', content: p },
      );
  }
  if (Array.isArray(node)) {
    return node.flatMap(flatten);
  }
  // React element — treat as a single atomic word.
  return [{ kind: 'word', content: node }];
}

function srText(node: React.ReactNode): string {
  if (node == null || node === false || node === true) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(srText).join('');
  if (React.isValidElement(node)) {
    return srText((node.props as { children?: React.ReactNode }).children);
  }
  return '';
}

/**
 * Per-word masked reveal. Server-renderable: the words are in the HTML and
 * the motion is CSS, so text is readable before (and without) hydration.
 * Screen readers get the full sentence from an sr-only copy.
 */
export default function SplitText({
  children,
  className,
  stagger = 0.05,
  duration = 0.8,
  delay = 0,
  inView = false,
}: SplitTextProps) {
  const segments = flatten(children);
  let wordIndex = 0;

  const style = {
    '--split-delay': `${Math.round(delay * 1000)}ms`,
    '--split-stagger': `${Math.round(stagger * 1000)}ms`,
    '--split-dur': `${Math.round(duration * 1000)}ms`,
  } as React.CSSProperties;

  return (
    <span
      className={`${inView ? 'split-inview' : 'split-load'}${className ? ` ${className}` : ''}`}
      style={style}
      data-inview=""
    >
      <span className="sr-only">{srText(children)}</span>
      <span aria-hidden>
        {segments.map((seg, i) =>
          seg.kind === 'space' ? (
            <span key={i}> </span>
          ) : (
            <span key={i} className="split-word">
              <span style={{ '--i': wordIndex++ } as React.CSSProperties}>
                {seg.content}
              </span>
            </span>
          ),
        )}
      </span>
    </span>
  );
}
