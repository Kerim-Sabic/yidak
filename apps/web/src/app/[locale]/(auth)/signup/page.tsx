import { SignupAuthForm } from '@/components/blocks/auth/signup-auth-form';

interface SignupPageProps {
  params: Promise<{ locale: string }>;
}

const SignupPage = async ({ params }: SignupPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';

  return <SignupAuthForm locale={locale} />;
};

export default SignupPage;
