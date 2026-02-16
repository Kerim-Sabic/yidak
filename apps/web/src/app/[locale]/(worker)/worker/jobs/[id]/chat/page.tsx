import { JobIdSchema } from '@yidak/types';
import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';

import { ChatSkeleton } from '@/components/blocks/skeletons';
import { getServerCaller } from '@/lib/trpc/server';

interface WorkerJobChatPageProps {
  params: Promise<{ locale: string; id: string }>;
}

const JobChatPanel = dynamic(
  async () => import('@/components/blocks/job-chat-panel').then((mod) => mod.JobChatPanel),
  {
    loading: () => <ChatSkeleton />,
  },
);

const allowedStatuses = new Set(['assigned', 'in_progress', 'completed', 'reviewed']);

const WorkerJobChatPage = async ({
  params,
}: WorkerJobChatPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale, id } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'chatUi.panel' });

  const parsedJob = JobIdSchema.safeParse(id);
  if (!parsedJob.success) {
    return <p className="text-muted-foreground text-sm">{t('unavailable')}</p>;
  }

  const caller = await getServerCaller();
  const payload = await caller.job.getById(parsedJob.data);
  if (!allowedStatuses.has(payload.job.status)) {
    return <p className="text-muted-foreground text-sm">{t('locked')}</p>;
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>
      <JobChatPanel jobId={id} locale={locale} fullHeight />
    </section>
  );
};

export default WorkerJobChatPage;
