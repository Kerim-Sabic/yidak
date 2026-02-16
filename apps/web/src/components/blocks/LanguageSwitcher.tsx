'use client';

import { Languages } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

interface LanguageSwitcherProps {
  locale: 'en' | 'ar';
  onLocaleChange?: (nextLocale: 'en' | 'ar') => void;
}

const swapLocaleSegment = (pathname: string, locale: 'en' | 'ar'): string => {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) {
    return `/${locale}`;
  }

  if (parts[0] === 'en' || parts[0] === 'ar') {
    parts[0] = locale;
  } else {
    parts.unshift(locale);
  }

  return `/${parts.join('/')}`;
};

export const LanguageSwitcher = ({
  locale,
  onLocaleChange
}: LanguageSwitcherProps): React.JSX.Element => {
  const router = useRouter();
  const pathname = usePathname();
  const nextLocale = locale === 'en' ? 'ar' : 'en';

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        onLocaleChange?.(nextLocale);
        router.push(swapLocaleSegment(pathname, nextLocale));
      }}
      aria-label="Switch language"
      className="gap-2"
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      {nextLocale.toUpperCase()}
    </Button>
  );
};

export default LanguageSwitcher;
