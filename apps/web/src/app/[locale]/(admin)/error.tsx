'use client';

import { useTranslations } from 'next-intl';

import { ErrorBoundaryView } from '@/components/primitives/error-boundary-view';

interface AdminErrorProps {
  reset: () => void;
}

const AdminError = ({ reset }: AdminErrorProps): React.JSX.Element => {
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

export default AdminError;
