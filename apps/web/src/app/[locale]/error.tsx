'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { ErrorBoundaryView } from '@/components/primitives/error-boundary-view';

interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

const ErrorPage = ({ error, reset }: ErrorPageProps): React.JSX.Element => {
  const t = useTranslations('errors');

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.reportError === 'function') {
      window.reportError(error);
    }
  }, [error]);

  return (
    <ErrorBoundaryView
      title={t('generic.title')}
      description={t('generic.description')}
      retryLabel={t('generic.retry')}
      reset={reset}
    />
  );
};

export default ErrorPage;
