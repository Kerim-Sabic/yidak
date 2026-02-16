'use client';

import { useTranslations } from 'next-intl';

import { ErrorBoundaryView } from '@/components/primitives/error-boundary-view';

interface CustomerErrorProps {
  reset: () => void;
}

const CustomerError = ({ reset }: CustomerErrorProps): React.JSX.Element => {
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

export default CustomerError;
