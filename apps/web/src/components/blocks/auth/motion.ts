import type { Transition } from 'framer-motion';

export const gentleSpring: Transition = { type: 'spring', stiffness: 120, damping: 14 };
export const snappySpring: Transition = { type: 'spring', stiffness: 300, damping: 30 };
export const bouncySpring: Transition = { type: 'spring', stiffness: 200, damping: 10, mass: 0.8 };
