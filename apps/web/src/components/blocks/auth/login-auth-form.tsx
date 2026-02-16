'use client';


import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useActionState, useEffect, useMemo, useRef, useState } from 'react';

import { AuthSubmitButton } from '@/components/blocks/auth/auth-submit-button';
import { GCC_COUNTRIES, type CountryCode } from '@/components/blocks/auth/constants';
import { gentleSpring, snappySpring } from '@/components/blocks/auth/motion';
import { OtpInput } from '@/components/blocks/auth/otp-input';
import { formatPhoneDigits } from '@/components/blocks/auth/phone-utils';
import { SocialLoginButtons } from '@/components/blocks/auth/social-login-buttons';
import { SuccessBurst } from '@/components/blocks/auth/success-burst';
import {
  requestStateInitial,
  sendOtpAction,
  verifyOtpAction,
  verifyStateInitial,
  type Locale
} from '@/lib/auth/actions';

interface LoginAuthFormProps {
  locale: Locale;
}

export const LoginAuthForm = ({ locale }: LoginAuthFormProps): React.JSX.Element => {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const verifyFormRef = useRef<HTMLFormElement | null>(null);

  const [country, setCountry] = useState<CountryCode>('AE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const [requestState, requestAction, requestPending] = useActionState(sendOtpAction, requestStateInitial);
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyOtpAction, verifyStateInitial);

  const hasOtpStage = requestState.status === 'sent' || verifyState.status !== 'idle';
  const shouldShake = requestState.status === 'error' || verifyState.status === 'error';

  useEffect(() => {
    if (!requestState.resendAt) {
      setSecondsRemaining(0);
      return;
    }

    const update = (): void => {
      const next = Math.max(0, Math.ceil((requestState.resendAt ?? 0 - Date.now()) / 1000));
      setSecondsRemaining(next);
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [requestState.resendAt]);

  useEffect(() => {
    if (verifyState.status !== 'success' || !verifyState.redirectPath) {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.replace(verifyState.redirectPath ?? `/${locale}/customer/dashboard`);
    }, 600);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [locale, router, verifyState.redirectPath, verifyState.status]);

  const selectedDialCode = useMemo(
    () => GCC_COUNTRIES.find((item) => item.code === country)?.dialCode ?? '+971',
    [country]
  );

  return (
    <motion.div
      animate={
        shouldShake && !reduceMotion
          ? { x: [0, -8, 8, -6, 0] }
          : { x: 0 }
      }
      transition={snappySpring}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <form action={requestAction} className="space-y-4">
        <input type="hidden" name="role" value="customer" />
        <input type="hidden" name="city" value="" />
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">{t('countryLabel')}</span>
            <select
              name="country"
              value={country}
              onChange={(event) => {
                const selected = event.target.value;
                if (selected === 'AE' || selected === 'SA' || selected === 'QA' || selected === 'BH' || selected === 'KW' || selected === 'OM') {
                  setCountry(selected);
                }
              }}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              {GCC_COUNTRIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {`${item.flag} ${item.dialCode}`}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-foreground">{t('phoneLabel')}</span>
            <div className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-3">
              <span className="text-sm text-muted-foreground">{selectedDialCode}</span>
              <input
                name="phone"
                value={phone}
                onChange={(event) => {
                  setPhone(formatPhoneDigits(event.target.value));
                }}
                inputMode="numeric"
                autoComplete="tel"
                className="w-full bg-transparent text-sm outline-none"
                placeholder={t('phonePlaceholder')}
              />
            </div>
          </label>
        </div>

        <AuthSubmitButton idleLabel={t('sendOtp')} pendingLabel={t('sendingOtp')} />
      </form>

      {requestPending ? <div className="h-14 animate-shimmer rounded-xl bg-muted" /> : <></>}

      {hasOtpStage ? (
        <motion.form
          ref={verifyFormRef}
          action={verifyAction}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={gentleSpring}
          className="space-y-4 rounded-xl border border-border bg-background/70 p-4"
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="country" value={country} />
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="code" value={otp} />

          <OtpInput
            label={t('otpLabel')}
            value={otp}
            disabled={verifyPending}
            hasError={verifyState.status === 'error'}
            onChange={setOtp}
            onComplete={() => {
              verifyFormRef.current?.requestSubmit();
            }}
          />

          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>{secondsRemaining > 0 ? t('resendIn', { seconds: secondsRemaining }) : t('resendNow')}</p>
            {verifyState.status === 'success' ? (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                {t('success')}
              </span>
            ) : <></>}
          </div>

          <AuthSubmitButton idleLabel={t('verifyOtp')} pendingLabel={t('verifyingOtp')} />
          <SuccessBurst active={verifyState.status === 'success'} />
        </motion.form>
      ) : <></>}

      {shouldShake ? (
        <div className="inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-4 w-4" aria-hidden />
          {t(requestState.status === 'error' ? requestState.messageKey ?? 'errors.generic' : 'errors.invalidOtp')}
        </div>
      ) : <></>}

      <SocialLoginButtons
        locale={locale}
        dividerLabel={t('socialDivider')}
        googleLabel={t('socialGoogle')}
        appleLabel={t('socialApple')}
      />

      <p className="text-center text-sm text-muted-foreground">
        {t('emailPrompt')}{' '}
        <Link href={`/${locale}/verify`} className="font-semibold text-primary hover:underline">
          {t('emailLink')}
        </Link>
      </p>
    </motion.div>
  );
};
