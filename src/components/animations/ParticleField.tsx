'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

export default function ParticleField() {
  const particles = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 8,
      color: [
        'rgba(99, 102, 241, 0.6)',
        'rgba(139, 92, 246, 0.6)',
        'rgba(6, 182, 212, 0.6)',
        'rgba(16, 185, 129, 0.6)',
        'rgba(245, 158, 11, 0.6)',
        'rgba(239, 68, 68, 0.6)'
      ][Math.floor(Math.random() * 6)]
    }));
  }, []);

  const gridLines = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      isVertical: i % 2 === 0,
      position: (i + 1) * 5,
      delay: i * 0.1
    }));
  }, []);

  return (
    <div className="absolute inset-0 -z-20 overflow-hidden">
      {/* Animated particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: `radial-gradient(circle, ${particle.color}, transparent)`,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
          }}
          animate={{
            y: [-60, 60, -60],
            x: [-30, 30, -30],
            opacity: [0.3, 0.8, 0.3],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        />
      ))}

      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10">
        {gridLines.map((line) => (
          <motion.div
            key={line.id}
            className={`absolute ${line.isVertical ? 'w-px h-full' : 'h-px w-full'}`}
            style={{
              [line.isVertical ? 'left' : 'top']: `${line.position}%`,
              background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent)',
            }}
            animate={{
              opacity: [0.1, 0.4, 0.1],
              scale: line.isVertical ? [1, 1.02, 1] : [1, 1.02, 1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: line.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Floating energy orbs */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${20 + (i * 10)}%`,
            top: `${20 + (i * 8)}%`,
            width: `${40 + i * 5}px`,
            height: `${40 + i * 5}px`,
            background: `radial-gradient(circle, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1), transparent)`,
            filter: 'blur(2px)',
          }}
          animate={{
            y: [-40, 40],
            x: [-20, 20],
            scale: [1, 1.3, 1],
            rotate: [0, 360],
          }}
          transition={{
            duration: 12 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Pulsing background waves */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.05) 0%, transparent 50%)
          `,
        }}
        animate={{
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
