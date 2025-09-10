'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

export default function ParticleField() {
  const particles = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
      color: [
        'bg-brand-400',
        'bg-electric-400',
        'bg-neon-400',
        'bg-sunset-400'
      ][Math.floor(Math.random() * 4)]
    }));
  }, []);

  return (
    <div className="absolute inset-0 -z-20 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${particle.color} opacity-20`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [-50, 50, -50],
            x: [-25, 25, -25],
            opacity: [0.1, 0.3, 0.1],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        />
      ))}

      {/* Animated grid lines */}
      <div className="absolute inset-0 opacity-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={`line-v-${i}`}
            className="absolute w-px h-full bg-brand-500"
            style={{ left: `${(i + 1) * 10}%` }}
            animate={{
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={`line-h-${i}`}
            className="absolute h-px w-full bg-electric-500"
            style={{ top: `${(i + 1) * 10}%` }}
            animate={{
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.2 + 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
