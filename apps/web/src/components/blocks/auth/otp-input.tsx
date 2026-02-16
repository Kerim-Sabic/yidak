'use client';

import { useMemo, useRef } from 'react';

import { cn } from '@/lib/utils';

interface OtpInputProps {
  label: string;
  value: string;
  disabled?: boolean;
  hasError?: boolean;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
}

const OTP_LENGTH = 6;

const clampDigits = (value: string): string => value.replace(/\D/g, '').slice(0, OTP_LENGTH);

export const OtpInput = ({
  label,
  value,
  disabled = false,
  hasError = false,
  onChange,
  onComplete
}: OtpInputProps): React.JSX.Element => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = useMemo(() => {
    const seeded = value.slice(0, OTP_LENGTH).split('');
    while (seeded.length < OTP_LENGTH) {
      seeded.push('');
    }

    return seeded;
  }, [value]);

  const commit = (next: string): void => {
    const cleaned = clampDigits(next);
    onChange(cleaned);

    if (cleaned.length === OTP_LENGTH && onComplete) {
      onComplete(cleaned);
    }
  };

  const setFocus = (index: number): void => {
    const target = inputRefs.current[index];
    if (target) {
      target.focus();
      target.select();
    }
  };

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <div className="grid grid-cols-6 gap-2">
        {digits.map((digit, index) => (
          <input
            key={`otp-${index}`}
            ref={(node) => {
              inputRefs.current[index] = node;
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(event) => {
              const nextDigit = clampDigits(event.target.value);
              const copy = digits.slice();
              copy[index] = nextDigit;
              const nextValue = copy.join('');
              commit(nextValue);

              if (nextDigit && index < OTP_LENGTH - 1) {
                setFocus(index + 1);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !digit && index > 0) {
                setFocus(index - 1);
              }
            }}
            onPaste={(event) => {
              event.preventDefault();
              const pasted = clampDigits(event.clipboardData.getData('text'));
              commit(pasted);
              if (pasted.length < OTP_LENGTH) {
                setFocus(pasted.length);
              }
            }}
            className={cn(
              'h-12 rounded-xl border bg-background text-center text-lg font-semibold text-foreground outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring',
              hasError ? 'border-destructive' : 'border-border'
            )}
          />
        ))}
      </div>
    </fieldset>
  );
};
