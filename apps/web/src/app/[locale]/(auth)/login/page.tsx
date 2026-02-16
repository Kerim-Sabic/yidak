import { LoginAuthForm } from '@/components/blocks/auth/login-auth-form';

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

const LoginPage = async ({ params }: LoginPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';

  return <LoginAuthForm locale={locale} />;
};

export default LoginPage;
