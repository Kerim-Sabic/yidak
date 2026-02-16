import { getTranslations } from 'next-intl/server';

const Page = async (): Promise<React.JSX.Element> => {
  const t = await getTranslations('customer.layout');

  return (
    <section>
      <h1 className="text-foreground text-2xl font-semibold">{t('profile')}</h1>
      <p className="text-muted-foreground mt-2 text-sm">{t('profile')}</p>
    </section>
  );
};

export default Page;
