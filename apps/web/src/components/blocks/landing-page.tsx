'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Hammer, ShieldCheck, Sparkles, WalletCards, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/primitives/button';

const gentle = { type: 'spring', stiffness: 120, damping: 14 } as const;
const snappy = { type: 'spring', stiffness: 300, damping: 30 } as const;

interface StepDefinition {
  key: 'post' | 'bid' | 'done';
  icon: LucideIcon;
}

interface CategoryDefinition {
  key: 'plumbing' | 'electrical' | 'cleaning' | 'ac';
  icon: LucideIcon;
}

const stepDefinitions: readonly StepDefinition[] = [
  { key: 'post', icon: Sparkles },
  { key: 'bid', icon: WalletCards },
  { key: 'done', icon: ShieldCheck },
] as const;

const categoryDefinitions: readonly CategoryDefinition[] = [
  { key: 'plumbing', icon: Wrench },
  { key: 'electrical', icon: Hammer },
  { key: 'cleaning', icon: Sparkles },
  { key: 'ac', icon: ShieldCheck },
] as const;

export const LandingPage = (): React.JSX.Element => {
  const t = useTranslations('landing');
  const locale = useLocale();
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative isolate overflow-hidden bg-[linear-gradient(160deg,color-mix(in_oklch,var(--background)_88%,white_12%)_0%,color-mix(in_oklch,var(--background)_76%,var(--accent)_24%)_100%)]">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_8%,color-mix(in_oklch,var(--primary)_38%,white_62%)_0%,transparent_48%),radial-gradient(circle_at_86%_14%,color-mix(in_oklch,var(--secondary)_65%,white_35%)_0%,transparent_42%),radial-gradient(circle_at_50%_84%,color-mix(in_oklch,var(--accent)_52%,white_48%)_0%,transparent_52%)]"
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0.6, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={gentle}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:gap-14 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <motion.article
            className="rounded-3xl border border-border/80 bg-card/90 px-6 py-8 shadow-[0_20px_60px_-35px_color-mix(in_oklch,var(--primary)_60%,transparent)] backdrop-blur-xl sm:px-8 sm:py-10"
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={gentle}
          >
            <p className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {t('hero.badge')}
            </p>
            <h1 className="mt-4 max-w-2xl text-balance text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              {t('hero.title')}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t('hero.subtitle')}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="primary">
                <Link href={`/${locale}/customer/jobs/new`}>{t('hero.ctaPost')}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={`/${locale}/signup?role=worker`}>{t('hero.ctaWorker')}</Link>
              </Button>
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              <li className="rounded-2xl border border-border/80 bg-background/85 px-4 py-3 text-sm text-muted-foreground">
                {t('highlights.one')}
              </li>
              <li className="rounded-2xl border border-border/80 bg-background/85 px-4 py-3 text-sm text-muted-foreground">
                {t('highlights.two')}
              </li>
              <li className="rounded-2xl border border-border/80 bg-background/85 px-4 py-3 text-sm text-muted-foreground">
                {t('highlights.three')}
              </li>
            </ul>
          </motion.article>

          <motion.aside
            className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/90 px-5 py-6 shadow-[0_20px_60px_-40px_color-mix(in_oklch,var(--secondary)_80%,transparent)] sm:px-6 sm:py-7"
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={snappy}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--secondary)_38%,transparent)_0%,transparent_100%)]"
            />
            <h2 className="relative text-xl font-semibold text-foreground">{t('howItWorks.title')}</h2>
            <div className="relative mt-5 space-y-3">
              {stepDefinitions.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.key}
                    className="rounded-2xl border border-border/75 bg-background/85 px-4 py-4"
                    initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...gentle, delay: reduceMotion ? 0 : index * 0.04 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <p className="text-base font-semibold text-foreground">
                        {t(`howItWorks.steps.${step.key}.title`)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t(`howItWorks.steps.${step.key}.description`)}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.aside>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{t('categories.title')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoryDefinitions.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.article
                  key={category.key}
                  className="group rounded-2xl border border-border/75 bg-card/90 px-5 py-5 shadow-[0_10px_36px_-30px_color-mix(in_oklch,var(--foreground)_80%,transparent)]"
                  initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...gentle, delay: reduceMotion ? 0 : index * 0.04 }}
                  {...(!reduceMotion ? { whileHover: { y: -4, transition: snappy } } : {})}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-secondary/45 text-foreground">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="mt-3 text-base font-semibold text-foreground">
                    {t(`categories.items.${category.key}`)}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-border/80 bg-card/90 px-6 py-7 shadow-[0_20px_60px_-40px_color-mix(in_oklch,var(--primary)_70%,transparent)] sm:px-8">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{t('trust.title')}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <p className="rounded-2xl border border-border/80 bg-background/85 px-4 py-3 text-sm text-muted-foreground">
              {t('trust.shariah')}
            </p>
            <p className="rounded-2xl border border-border/80 bg-background/85 px-4 py-3 text-sm text-muted-foreground">
              {t('trust.gcc')}
            </p>
            <p className="rounded-2xl border border-border/80 bg-background/85 px-4 py-3 text-sm text-muted-foreground">
              {t('trust.payments')}
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {['AE', 'SA', 'QA', 'BH', 'KW', 'OM'].map((countryCode) => (
              <span
                key={countryCode}
                className="rounded-full border border-border/75 bg-secondary/25 px-3 py-1 text-xs font-semibold tracking-wide text-secondary-foreground"
              >
                {countryCode}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
