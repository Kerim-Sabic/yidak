'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface SuccessConfettiProps {
  label: string;
}

const particles = Array.from({ length: 16 }, (_, index) => ({
  id: index,
  x: (index % 4) * 18 - 26,
  y: Math.floor(index / 4) * -12 - 10
}));

export const SuccessConfetti = ({ label }: SuccessConfettiProps): React.JSX.Element => {
  const reducedMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <motion.div
        initial={reducedMotion ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 200, damping: 10 }
        }
        className="relative flex h-24 w-24 items-center justify-center rounded-full border border-emerald-300 bg-emerald-500/10 text-emerald-700"
      >
        <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
        <span className="sr-only">{label}</span>

        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.4, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.7], x: particle.x, y: particle.y }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.9, delay: particle.id * 0.02 }
            }
            className="absolute h-2 w-2 rounded-full bg-emerald-500"
          />
        ))}
      </motion.div>
    </div>
  );
};

export default SuccessConfetti;
