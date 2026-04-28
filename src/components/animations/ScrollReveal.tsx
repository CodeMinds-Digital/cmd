'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, useInView, useReducedMotion } from 'framer-motion';

type ScrollRevealProps = {
  children: React.ReactNode;
  width?: 'fit-content' | '100%';
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  className?: string;
  once?: boolean;
};

const ScrollReveal = ({
  children,
  width = 'fit-content',
  delay = 0,
  direction = 'up',
  duration = 0.5,
  className = '',
  once = true,
}: ScrollRevealProps) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once });
  const prefersReducedMotion = useReducedMotion();

  const getDirection = () => {
    if (prefersReducedMotion) return {};
    switch (direction) {
      case 'up':
        return { y: 40 };
      case 'down':
        return { y: -40 };
      case 'left':
        return { x: 40 };
      case 'right':
        return { x: -40 };
      case 'none':
        return {};
      default:
        return { y: 40 };
    }
  };

  // Animation variants
  const variants = {
    hidden: {
      opacity: 0,
      ...getDirection(),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Smooth easing
      },
    },
  };

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    } else if (!once) {
      controls.start('hidden');
    }
  }, [isInView, controls, once]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      style={{ width }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;