import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import type { EmailOtpType } from '@supabase/supabase-js';

import { createClient, getRoleDashboardPath } from '@/lib/supabase/server';

const isEmailOtpType = (value: string): value is EmailOtpType =>
  value === 'signup' ||
  value === 'recovery' ||
  value === 'invite' ||
  value === 'email_change' ||
  value === 'magiclink';

interface VerifyPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const toProfileRole = (value: unknown): 'customer' | 'worker' | 'admin' | null => {
  if (value === 'customer' || value === 'worker' || value === 'admin') {
    return value;
  }

  return null;
};

const readSingleParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
};

const VerifyPage = async ({
  params,
  searchParams,
}: VerifyPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const query = await searchParams;
  const t = await getTranslations({ locale, namespace: 'auth.verify' });

  const code = readSingleParam(query.code);
  const tokenHash = readSingleParam(query.token_hash);
  const typeValue = readSingleParam(query.type);

  const supabase = await createClient();
  let verificationError = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    verificationError = Boolean(error);
  } else if (tokenHash && isEmailOtpType(typeValue)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: typeValue,
    });
    verificationError = Boolean(error);
  }

  if (!verificationError) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const profileResult = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();
      const roleValue =
        profileResult.data && typeof profileResult.data === 'object'
          ? Reflect.get(profileResult.data, 'role')
          : null;
      const role = toProfileRole(roleValue) ?? 'customer';
      redirect(`/${locale}${getRoleDashboardPath(role)}`);
    }
  }

  return (
    <main className="space-y-4 text-center">
      <h2 className="text-foreground text-2xl font-semibold">{t('title')}</h2>
      <p className="text-muted-foreground text-sm">
        {verificationError ? t('error') : t('subtitle')}
      </p>
      <Link
        href={`/${locale}/login`}
        className="bg-primary text-primary-foreground inline-flex rounded-xl px-4 py-2 text-sm font-semibold"
      >
        {t('backToLogin')}
      </Link>
    </main>
  );
};

export default VerifyPage;
