'use client';

import { formatRelativeTime, formatCurrency } from '@yidak/utils';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface JobDetailContentProps {
  locale: 'en' | 'ar';
  title: string;
  status: string;
  categoryName: string;
  description: string;
  photos: ReadonlyArray<string>;
  budgetMin: number;
  budgetMax: number;
  country: 'AE' | 'SA' | 'QA' | 'BH' | 'KW' | 'OM';
  urgency: string;
  createdAt: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
}

const statusClass = (status: string): string => {
  if (status === 'completed' || status === 'reviewed') return 'bg-emerald-500/15 text-emerald-700';
  if (status === 'cancelled' || status === 'expired') return 'bg-rose-500/15 text-rose-700';
  if (status === 'assigned' || status === 'in_progress') return 'bg-sky-500/15 text-sky-700';
  return 'bg-amber-500/15 text-amber-700';
};

const mapImageSrc = (latitude: number, longitude: number): string =>
  `https://maps.google.com/maps?q=${latitude},${longitude}&z=13&output=embed`;

export const JobDetailContent = ({
  locale,
  title,
  status,
  categoryName,
  description,
  photos,
  budgetMin,
  budgetMax,
  country,
  urgency,
  createdAt,
  city,
  address,
  latitude,
  longitude
}: JobDetailContentProps): React.JSX.Element => {
  const t = useTranslations('customer.jobs.detail');
  const reducedMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const shortDescription = description.length > 240 ? `${description.slice(0, 240)}...` : description;

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">{categoryName}</p>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge className={statusClass(status)}>{status}</Badge>
          <Badge variant="secondary" className="capitalize">{urgency}</Badge>
          <span className="text-xs text-muted-foreground">
            {t('postedAgo', { value: formatRelativeTime(new Date(createdAt), locale) })}
          </span>
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('descriptionLabel')}</h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={expanded ? 'full' : 'short'}
            initial={reducedMotion ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
            className="mt-2 text-sm leading-6 text-foreground"
          >
            {expanded ? description : shortDescription}
          </motion.p>
        </AnimatePresence>
        {description.length > 240 ? (
          <Button type="button" variant="link" className="px-0" onClick={() => { setExpanded((prev) => !prev); }}>
            {expanded ? t('readLess') : t('readMore')}
          </Button>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('photosLabel')}</h2>
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1">
          {photos.length > 0 ? (
            photos.map((photo) => (
              <button
                key={photo}
                type="button"
                onClick={() => { setActivePhoto(photo); }}
                className="shrink-0 snap-start overflow-hidden rounded-lg border"
              >
                <img src={photo} alt={t('photoAlt')} className="h-28 w-44 object-cover" />
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t('noPhotos')}</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
          {city}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{address}</p>
        <iframe title="Location map" src={mapImageSrc(latitude, longitude)} className="mt-3 h-40 w-full rounded-lg border-0" loading="lazy" />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('budgetLabel')}</h2>
        <p className="mt-2 text-lg font-semibold text-foreground">
          {formatCurrency(budgetMin, country)} - {formatCurrency(budgetMax, country)}
        </p>
      </section>

      <Dialog open={!!activePhoto} onOpenChange={(open) => { setActivePhoto(open ? activePhoto : null); }}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
          {activePhoto ? (
            <img src={activePhoto} alt={t('photoAlt')} className="max-h-[80vh] w-full rounded-lg object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobDetailContent;
