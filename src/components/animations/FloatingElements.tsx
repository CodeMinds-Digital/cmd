'use client';

import { motion } from 'framer-motion';

const shapes = [
  {
    id: 1,
    type: 'circle',
    color: 'bg-brand-200',
    size: 'w-16 h-16',
    position: 'top-1/4 left-1/4',
    delay: 0
  },
  {
    id: 2,
    type: 'square',
    color: 'bg-electric-200',
    size: 'w-12 h-12',
    position: 'top-1/3 right-1/4',
    delay: 0.5
  },
  {
    id: 3,
    type: 'triangle',
    color: 'bg-neon-200',
    size: 'w-14 h-14',
    position: 'bottom-1/3 left-1/3',
    delay: 1
  },
  {
    id: 4,
    type: 'circle',
    color: 'bg-sunset-200',
    size: 'w-10 h-10',
    position: 'bottom-1/4 right-1/3',
    delay: 1.5
  },
  {
    id: 5,
    type: 'square',
    color: 'bg-brand-300',
    size: 'w-8 h-8',
    position: 'top-1/2 left-1/2',
    delay: 2
  },
];

export default function FloatingElements() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className={`absolute ${shape.position} ${shape.size} ${shape.color} opacity-30`}
          style={{
            borderRadius: shape.type === 'circle' ? '50%' : shape.type === 'triangle' ? '0' : '8px',
            clipPath: shape.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            rotate: [0, 180, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8 + shape.id,
            repeat: Infinity,
            ease: "easeInOut",
            delay: shape.delay,
          }}
        />
      ))}

      {/* Additional floating dots */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`dot-${i}`}
          className="absolute w-2 h-2 bg-brand-400 rounded-full opacity-20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-30, 30],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}
