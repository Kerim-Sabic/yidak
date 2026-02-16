import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

const hasLocale = (locale: string): boolean => routing.locales.some((supported) => supported === locale);

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && hasLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
