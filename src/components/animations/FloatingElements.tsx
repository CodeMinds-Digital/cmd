'use client';

import { motion } from 'framer-motion';

const shapes = [
  {
    id: 1,
    type: 'sphere',
    color: 'bg-gradient-to-br from-brand-400 to-brand-600',
    size: 'w-20 h-20',
    position: 'top-1/4 left-1/4',
    delay: 0,
    shadow: 'shadow-2xl shadow-brand-500/30'
  },
  {
    id: 2,
    type: 'cube',
    color: 'bg-gradient-to-br from-electric-400 to-electric-600',
    size: 'w-16 h-16',
    position: 'top-1/3 right-1/4',
    delay: 0.5,
    shadow: 'shadow-2xl shadow-electric-500/30'
  },
  {
    id: 3,
    type: 'diamond',
    color: 'bg-gradient-to-br from-neon-400 to-neon-600',
    size: 'w-18 h-18',
    position: 'bottom-1/3 left-1/3',
    delay: 1,
    shadow: 'shadow-2xl shadow-neon-500/30'
  },
  {
    id: 4,
    type: 'sphere',
    color: 'bg-gradient-to-br from-sunset-400 to-sunset-600',
    size: 'w-14 h-14',
    position: 'bottom-1/4 right-1/3',
    delay: 1.5,
    shadow: 'shadow-2xl shadow-sunset-500/30'
  },
  {
    id: 5,
    type: 'hexagon',
    color: 'bg-gradient-to-br from-brand-500 to-electric-500',
    size: 'w-12 h-12',
    position: 'top-1/2 left-1/2',
    delay: 2,
    shadow: 'shadow-2xl shadow-brand-500/20'
  },
];

const getShapeStyles = (type: string) => {
  switch (type) {
    case 'sphere':
      return 'rounded-full';
    case 'cube':
      return 'rounded-xl transform rotate-12';
    case 'diamond':
      return 'rounded-lg transform rotate-45';
    case 'hexagon':
      return 'rounded-lg transform rotate-30';
    default:
      return 'rounded-full';
  }
};

export default function FloatingElements() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Main floating shapes */}
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className={`absolute ${shape.position} ${shape.size} ${shape.color} ${shape.shadow} ${getShapeStyles(shape.type)} opacity-80`}
          style={{
            filter: 'blur(0.5px)',
            background: `linear-gradient(135deg, ${shape.color.includes('brand') ? '#6366f1' : shape.color.includes('electric') ? '#06b6d4' : shape.color.includes('neon') ? '#10b981' : '#f59e0b'}, ${shape.color.includes('brand') ? '#4f46e5' : shape.color.includes('electric') ? '#0891b2' : shape.color.includes('neon') ? '#059669' : '#ea580c'})`,
          }}
          animate={{
            y: [-30, 30, -30],
            x: [-15, 15, -15],
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12 + shape.id * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: shape.delay,
          }}
        />
      ))}

      {/* Floating particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-3 h-3 rounded-full opacity-40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `linear-gradient(45deg, #6366f1, #8b5cf6)`,
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
          }}
          animate={{
            y: [-50, 50],
            x: [-25, 25],
            opacity: [0.2, 0.6, 0.2],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 8 + Math.random() * 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 3,
          }}
        />
      ))}

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.2) 50%, transparent 100%)',
          filter: 'blur(40px)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.div
        className="absolute top-1/3 right-1/3 w-80 h-80 rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, rgba(16,185,129,0.2) 50%, transparent 100%)',
          filter: 'blur(35px)',
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}
