'use client';

import { useTranslations } from 'next-intl';

import { ErrorBoundaryView } from '@/components/primitives/error-boundary-view';

interface WorkerErrorProps {
  reset: () => void;
}

const WorkerError = ({ reset }: WorkerErrorProps): React.JSX.Element => {
  const t = useTranslations('errors');

  return (
    <ErrorBoundaryView
      title={t('generic.title')}
      description={t('generic.description')}
      retryLabel={t('generic.retry')}
      reset={reset}
    />
  );
};

export default WorkerError;
