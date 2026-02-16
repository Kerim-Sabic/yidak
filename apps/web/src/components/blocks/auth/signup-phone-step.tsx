'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';


import { AuthSubmitButton } from '@/components/blocks/auth/auth-submit-button';
import { GCC_COUNTRIES, type CountryCode } from '@/components/blocks/auth/constants';
import { gentleSpring } from '@/components/blocks/auth/motion';
import { OtpInput } from '@/components/blocks/auth/otp-input';
import { formatPhoneDigits } from '@/components/blocks/auth/phone-utils';
import {
  type Locale,
  type OtpRequestState,
  type OtpVerifyState,
  type SignupRole
} from '@/lib/auth/actions';

interface SignupPhoneStepProps {
  locale: Locale;
  role: SignupRole;
  country: CountryCode;
  phone: string;
  otp: string;
  requestState: OtpRequestState;
  verifyState: OtpVerifyState;
  verifyPending: boolean;
  title: string;
  subtitle: string;
  countryLabel: string;
  phoneLabel: string;
  phonePlaceholder: string;
  otpLabel: string;
  sendOtpLabel: string;
  sendingOtpLabel: string;
  verifyOtpLabel: string;
  verifyingOtpLabel: string;
  resendInLabel: string;
  resendNowLabel: string;
  errorLabel: string;
  onCountryChange: (country: CountryCode) => void;
  onPhoneChange: (value: string) => void;
  onOtpChange: (value: string) => void;
  onRequestSubmit: (formData: FormData) => void;
  onVerifySubmit: (formData: FormData) => void;
}

export const SignupPhoneStep = ({
  locale,
  role,
  country,
  phone,
  otp,
  requestState,
  verifyState,
  verifyPending,
  title,
  subtitle,
  countryLabel,
  phoneLabel,
  phonePlaceholder,
  otpLabel,
  sendOtpLabel,
  sendingOtpLabel,
  verifyOtpLabel,
  verifyingOtpLabel,
  resendInLabel,
  resendNowLabel,
  errorLabel,
  onCountryChange,
  onPhoneChange,
  onOtpChange,
  onRequestSubmit,
  onVerifySubmit
}: SignupPhoneStepProps): React.JSX.Element => {
  const reduceMotion = useReducedMotion();
  const verifyFormRef = useRef<HTMLFormElement | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const selectedDialCode = useMemo(
    () => GCC_COUNTRIES.find((item) => item.code === country)?.dialCode ?? '+971',
    [country]
  );

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

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <form action={onRequestSubmit} className="space-y-4">
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="city" value="" />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">{countryLabel}</span>
            <select
              name="country"
              value={country}
              onChange={(event) => {
                const selected = event.target.value;
                if (selected === 'AE' || selected === 'SA' || selected === 'QA' || selected === 'BH' || selected === 'KW' || selected === 'OM') {
                  onCountryChange(selected);
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
            <span className="text-sm font-medium text-foreground">{phoneLabel}</span>
            <div className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-3">
              <span className="text-sm text-muted-foreground">{selectedDialCode}</span>
              <input
                name="phone"
                value={phone}
                onChange={(event) => {
                  onPhoneChange(formatPhoneDigits(event.target.value));
                }}
                inputMode="numeric"
                autoComplete="tel"
                className="w-full bg-transparent text-sm outline-none"
                placeholder={phonePlaceholder}
              />
            </div>
          </label>
        </div>

        <AuthSubmitButton idleLabel={sendOtpLabel} pendingLabel={sendingOtpLabel} />
      </form>

      {requestState.status === 'sent' ? (
        <motion.form
          ref={verifyFormRef}
          action={onVerifySubmit}
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
            label={otpLabel}
            value={otp}
            disabled={verifyPending}
            hasError={verifyState.status === 'error'}
            onChange={onOtpChange}
            onComplete={() => {
              verifyFormRef.current?.requestSubmit();
            }}
          />

          <p className="text-xs text-muted-foreground">
            {secondsRemaining > 0 ? `${resendInLabel} ${secondsRemaining}` : resendNowLabel}
          </p>

          <AuthSubmitButton idleLabel={verifyOtpLabel} pendingLabel={verifyingOtpLabel} />
        </motion.form>
      ) : <></>}

      {requestState.status === 'error' || verifyState.status === 'error' ? (
        <div className="inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-4 w-4" aria-hidden />
          {errorLabel}
        </div>
      ) : <></>}
    </div>
  );
};
