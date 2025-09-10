'use client';

import { motion } from 'framer-motion';

const LoadingAnimation = () => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Advanced CSS Logo Animation */}
        <motion.div
          className="mb-8 w-32 h-32 mx-auto relative"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-2xl"
            animate={{
              rotateY: [0, 360],
              rotateX: [0, 15, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              transformStyle: 'preserve-3d',
              boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.5)',
            }}
          >
            CS
          </motion.div>

          {/* Floating particles around logo */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-brand-400 rounded-full"
              style={{
                top: `${20 + Math.sin(i * 45 * Math.PI / 180) * 40}%`,
                left: `${50 + Math.cos(i * 45 * Math.PI / 180) * 40}%`,
              }}
              animate={{
                scale: [0.5, 1.2, 0.5],
                opacity: [0.3, 1, 0.3],
                rotate: [0, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>

        {/* Loading Dots */}
        <div className="flex space-x-2 justify-center mb-6">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-3 h-3 bg-brand-600 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            />
          ))}
        </div>

        {/* Loading Text */}
        <motion.p
          className="text-neutral-600 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Creating amazing experiences...
        </motion.p>

        {/* Progress Bar */}
        <div className="w-64 h-1 bg-neutral-200 rounded-full mx-auto mt-6 overflow-hidden">
          <motion.div
            className="h-full bg-brand-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
