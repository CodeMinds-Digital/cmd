'use client';

import { motion } from 'framer-motion';

const LoadingAnimation = () => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Logo Animation */}
        <motion.div
          className="mb-8"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="w-20 h-20 mx-auto bg-brand-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            CS
          </div>
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
