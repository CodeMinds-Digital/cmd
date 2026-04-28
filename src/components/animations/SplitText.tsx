'use client';

import { motion } from 'framer-motion';
import React from 'react';

type SplitTextProps = {
  /**
   * Either a plain string (split into words) or an array of strings and
   * inline elements. Inline elements are treated as one atomic word so a
   * styled accent (e.g. an italic serif span) can ride inside the same
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
  /** Use `whileInView` instead of `animate` (default false — fires on mount). */
  inView?: boolean;
};

const wordVariants = {
  hidden: { y: '110%' },
  show: { y: '0%' },
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

export default function SplitText({
  children,
  className,
  stagger = 0.05,
  duration = 0.8,
  delay = 0,
  inView = false,
}: SplitTextProps) {
  const segments = flatten(children);
  const animateProp = inView
    ? { whileInView: 'show' as const }
    : { animate: 'show' as const };

  return (
    <span className={className}>
      <span className="sr-only">{srText(children)}</span>
      <motion.span
        aria-hidden
        initial="hidden"
        {...animateProp}
        viewport={inView ? { once: true, amount: 0.5 } : undefined}
        transition={{
          staggerChildren: stagger,
          delayChildren: delay,
        }}
        style={{ display: 'inline' }}
      >
        {segments.map((seg, i) =>
          seg.kind === 'space' ? (
            <span key={i}> </span>
          ) : (
            <span
              key={i}
              style={{
                display: 'inline-block',
                overflow: 'hidden',
                verticalAlign: 'bottom',
                lineHeight: 1.05,
              }}
            >
              <motion.span
                variants={wordVariants}
                transition={{
                  duration,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ display: 'inline-block' }}
              >
                {seg.content}
              </motion.span>
            </span>
          ),
        )}
      </motion.span>
    </span>
  );
}
