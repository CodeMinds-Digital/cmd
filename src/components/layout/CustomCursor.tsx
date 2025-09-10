'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [clicked, setClicked] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => setClicked(true);
    const handleMouseUp = () => setClicked(false);
    
    const handleLinkHoverEvents = () => {
      document.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('mouseenter', () => setLinkHovered(true));
        el.addEventListener('mouseleave', () => setLinkHovered(false));
      });
    };

    const handleMouseLeave = () => setHidden(true);
    const handleMouseEnter = () => setHidden(false);

    document.addEventListener('mousemove', updatePosition);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    handleLinkHoverEvents();

    return () => {
      document.removeEventListener('mousemove', updatePosition);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.querySelectorAll('a, button').forEach(el => {
        el.removeEventListener('mouseenter', () => setLinkHovered(true));
        el.removeEventListener('mouseleave', () => setLinkHovered(false));
      });
    };
  }, []);

  const variants = {
    default: {
      x: position.x - 12,
      y: position.y - 12,
      opacity: hidden ? 0 : 0.8
    },
    text: {
      height: 40,
      width: 40,
      x: position.x - 20,
      y: position.y - 20,
      backgroundColor: 'rgba(99, 102, 241, 0.05)',
      mixBlendMode: 'normal' as 'normal'
    },
    clicked: {
      height: 10,
      width: 10,
      backgroundColor: 'rgba(99, 102, 241, 0.7)'
    }
  };

  const spring = {
    type: 'spring',
    stiffness: 400,
    damping: 30
  };

  // Only render on client side
  if (typeof window === 'undefined') return null;

  return (
    <>
      <motion.div
        className="cursor-dot hidden md:block fixed top-0 left-0 w-6 h-6 bg-transparent border border-secondary-500 rounded-full pointer-events-none z-[9999]"
        animate={linkHovered ? 'text' : clicked ? 'clicked' : 'default'}
        variants={variants}
        transition={spring}
      />
      <motion.div
        className="cursor-ring hidden md:block fixed top-0 left-0 w-2 h-2 bg-gradient-to-r from-secondary-500 to-primary-600 rounded-full pointer-events-none z-[9999] opacity-50"
        animate={{
          x: position.x - 4,
          y: position.y - 4,
          opacity: hidden ? 0 : 0.5,
          scale: clicked ? 0.5 : linkHovered ? 1.2 : 1
        }}
        transition={{
          type: 'spring',
          stiffness: 800,
          damping: 40
        }}
      />
      <style jsx global>{`
        body {
          cursor: none;
        }
        
        @media (max-width: 768px) {
          body {
            cursor: auto;
          }
        }
        
        a, button {
          cursor: none;
        }
        
        @media (max-width: 768px) {
          a, button {
            cursor: pointer;
          }
        }
      `}</style>
    </>
  );
};

export default CustomCursor;