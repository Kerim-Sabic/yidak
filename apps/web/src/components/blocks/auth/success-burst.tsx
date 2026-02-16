'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { bouncySpring } from '@/components/blocks/auth/motion';

interface SuccessBurstProps {
  active: boolean;
}

const particles = [
  { x: -42, y: -24, color: 'bg-primary' },
  { x: -18, y: -38, color: 'bg-secondary' },
  { x: 0, y: -46, color: 'bg-emerald-500' },
  { x: 18, y: -36, color: 'bg-amber-500' },
  { x: 40, y: -22, color: 'bg-rose-500' }
] as const;

export const SuccessBurst = ({ active }: SuccessBurstProps): React.JSX.Element => {
  const reduceMotion = useReducedMotion();

  if (!active) {
    return <></>;
  }

  return (
    <div className="pointer-events-none relative h-0 w-full">
      {particles.map((particle, index) => (
        <motion.span
          key={`particle-${index}`}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.3, x: 0, y: 0 }}
          animate={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: [0, 1, 0], scale: [0.3, 1, 0.2], x: particle.x, y: particle.y }
          }
          transition={bouncySpring}
          className={`absolute inset-0 mx-auto h-2 w-2 rounded-full ${particle.color}`}
        />
      ))}
    </div>
  );
};
