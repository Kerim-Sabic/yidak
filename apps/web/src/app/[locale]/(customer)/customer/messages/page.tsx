import { getTranslations } from 'next-intl/server';

import { ConversationList } from '@/components/blocks/conversation-list';

interface MessagesPageProps {
  params: Promise<{ locale: string }>;
}

const MessagesPage = async ({ params }: MessagesPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'chatUi.conversations' });

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>
      <ConversationList locale={locale} role="customer" />
    </section>
  );
};

export default MessagesPage;
