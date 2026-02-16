import { JobBidsPanel } from '@/components/blocks/job-bids-panel';

interface JobBidsPageProps {
  params: Promise<{ locale: string; id: string }>;
}

const JobBidsPage = async ({ params }: JobBidsPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale, id } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';

  return <JobBidsPanel locale={locale} jobId={id} />;
};

export default JobBidsPage;
