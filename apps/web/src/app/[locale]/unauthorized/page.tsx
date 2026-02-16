import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

interface UnauthorizedPageProps {
  params: Promise<{ locale: string }>;
}

const UnauthorizedPage = async ({ params }: UnauthorizedPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'auth.unauthorized' });

  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-16 text-center sm:px-6">
      <h1 className="text-foreground text-3xl font-semibold">{t('title')}</h1>
      <p className="text-muted-foreground text-sm">{t('description')}</p>
      <Link
        href={`/${locale}`}
        className="bg-primary text-primary-foreground inline-flex rounded-xl px-4 py-2 text-sm font-semibold"
      >
        {t('backHome')}
      </Link>
    </main>
  );
};

export default UnauthorizedPage;
