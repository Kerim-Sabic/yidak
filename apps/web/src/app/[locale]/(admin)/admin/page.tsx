import { redirect } from 'next/navigation';

interface AdminIndexPageProps {
  params: Promise<{ locale: string }>;
}

const AdminIndexPage = async ({ params }: AdminIndexPageProps): Promise<never> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  redirect(`/${locale}/admin/dashboard`);
};

export default AdminIndexPage;
