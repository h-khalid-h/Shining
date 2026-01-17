import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingDotsProps {
  text: string;
}

export const LoadingDots = memo(({ text }: LoadingDotsProps) => {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prevDotCount) => (prevDotCount + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-center items-center h-full"
    >
      <div className="relative">
        <span className="text-bolt-elements-textSecondary">{text}</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={dotCount}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute left-[calc(100%+4px)]"
          >
            {'.'.repeat(dotCount)}
          </motion.span>
        </AnimatePresence>
        <span className="invisible">...</span>
      </div>
    </motion.div>
  );
});
