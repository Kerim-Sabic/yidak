'use client';

import { Apple, Chrome } from 'lucide-react';

import { startSocialLoginAction } from '@/lib/auth/actions';

interface SocialLoginButtonsProps {
  locale: 'en' | 'ar';
  dividerLabel: string;
  googleLabel: string;
  appleLabel: string;
}

const socialButtonClassName =
  'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-card-foreground transition hover:bg-muted';

export const SocialLoginButtons = ({
  locale,
  dividerLabel,
  googleLabel,
  appleLabel
}: SocialLoginButtonsProps): React.JSX.Element => (
  <div className="space-y-4">
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <p className="relative mx-auto w-fit bg-background px-3 text-xs text-muted-foreground">{dividerLabel}</p>
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
      <form action={startSocialLoginAction}>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="provider" value="google" />
        <button type="submit" className={socialButtonClassName}>
          <Chrome className="h-4 w-4 text-[#EA4335]" aria-hidden />
          {googleLabel}
        </button>
      </form>

      <form action={startSocialLoginAction}>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="provider" value="apple" />
        <button type="submit" className={socialButtonClassName}>
          <Apple className="h-4 w-4 text-foreground" aria-hidden />
          {appleLabel}
        </button>
      </form>
    </div>
  </div>
);
