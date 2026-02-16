import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';

const NotFoundPage = async (): Promise<React.JSX.Element> => {
  const locale = await getLocale();
  const t = await getTranslations('notFound');

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-foreground text-3xl font-semibold">{t('title')}</h1>
      <p className="text-muted-foreground mt-3">{t('description')}</p>
      <Link
        href={`/${locale}`}
        className="bg-primary text-primary-foreground mt-6 inline-flex rounded-md px-4 py-2"
      >
        {t('goHome')}
      </Link>
    </main>
  );
};

export default NotFoundPage;
