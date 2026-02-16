import { JobIdSchema } from '@yidak/types';
import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';

import { ChatSkeleton } from '@/components/blocks/skeletons';
import { getServerCaller } from '@/lib/trpc/server';

interface JobChatPageProps {
  params: Promise<{ locale: string; id: string }>;
}

const JobChatPanel = dynamic(
  async () => import('@/components/blocks/job-chat-panel').then((mod) => mod.JobChatPanel),
  {
    loading: () => <ChatSkeleton />,
  },
);

const chatAllowedStatuses = new Set(['assigned', 'in_progress', 'completed', 'reviewed']);

const JobChatPage = async ({ params }: JobChatPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale, id } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'customer.jobs.detail' });

  const parsedJob = JobIdSchema.safeParse(id);
  if (!parsedJob.success) {
    return <p className="text-muted-foreground text-sm">{t('chatUnavailable')}</p>;
  }

  const caller = await getServerCaller();
  const payload = await caller.job.getById(parsedJob.data);

  if (!chatAllowedStatuses.has(payload.job.status)) {
    return <p className="text-muted-foreground text-sm">{t('chatLocked')}</p>;
  }

  return <JobChatPanel jobId={id} locale={locale} />;
};

export default JobChatPage;
