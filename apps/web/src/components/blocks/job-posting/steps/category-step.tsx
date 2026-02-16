'use client';

import { useTranslations } from 'next-intl';

import { CategoryGrid } from '@/components/blocks/CategoryGrid';
import { JOB_CATEGORIES } from '@/components/blocks/job-posting/constants';

interface CategoryStepProps {
  value: string;
  onChange: (categoryId: string) => void;
}

export const CategoryStep = ({ value, onChange }: CategoryStepProps): React.JSX.Element => {
  const t = useTranslations('customer.jobs.new');

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t('steps.category.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('steps.category.subtitle')}</p>
      </div>

      <CategoryGrid categories={JOB_CATEGORIES} selectedCategoryId={value} onSelect={onChange} />
    </section>
  );
};

export default CategoryStep;
