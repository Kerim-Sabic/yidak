'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Wrench } from 'lucide-react';

import type { ReactNode } from 'react';


import { gentleSpring, snappySpring } from '@/components/blocks/auth/motion';

interface AuthShellProps {
  locale: 'en' | 'ar';
  title: string;
  tagline: string;
  children: ReactNode;
}

export const AuthShell = ({ locale, title, tagline, children }: AuthShellProps): React.JSX.Element => {
  const reduceMotion = useReducedMotion();
  const isRtl = locale === 'ar';

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto grid min-h-dvh max-w-7xl items-stretch lg:grid-cols-2">
        <motion.aside
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: isRtl ? 24 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={gentleSpring}
          className={`relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,oklch(0.88_0.1_197.8),transparent_45%),radial-gradient(circle_at_80%_10%,oklch(0.85_0.12_83.2),transparent_50%),linear-gradient(160deg,oklch(0.28_0.04_224),oklch(0.22_0.03_220))] p-8 text-primary-foreground ${isRtl ? 'lg:order-2' : ''}`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,oklch(0.95_0.02_220_/_.07)_50%,transparent_100%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-2 text-sm font-semibold">
              <Wrench className="h-4 w-4" aria-hidden />
              Yidak
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
              <p className="max-w-md text-sm text-primary-foreground/85 sm:text-base">{tagline}</p>
            </div>
          </div>
        </motion.aside>

        <motion.main
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={snappySpring}
          className="flex items-center justify-center p-4 py-8 sm:p-8"
        >
          <div className="w-full max-w-xl rounded-2xl border border-border/80 bg-card/80 p-5 shadow-lg backdrop-blur sm:p-8">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
};
