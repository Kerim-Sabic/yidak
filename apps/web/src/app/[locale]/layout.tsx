import { IBM_Plex_Sans_Arabic, Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Toaster } from 'sonner';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { PwaRegister } from '@/components/primitives/pwa-register';
import { ThemeProvider } from '@/components/primitives/theme-provider';
import { routing } from '@/i18n/routing';
import { TRPCProvider } from '@/lib/trpc/provider';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

const hasLocale = (locale: string): boolean =>
  routing.locales.some((supported) => supported === locale);

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  variable: '--font-ibm-plex-arabic',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
});

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export const generateStaticParams = (): { locale: string }[] =>
  routing.locales.map((locale) => ({ locale }));

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const generateMetadata = async ({ params }: LocaleLayoutProps): Promise<Metadata> => {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'metadata' });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yidak.app';

  return {
    metadataBase: new URL(appUrl),
    title: {
      default: t('title'),
      template: `%s | ${t('title')}`,
    },
    description: t('description'),
    manifest: '/manifest.json',
    icons: {
      icon: [{ url: '/icons/icon-192.png', type: 'image/png' }],
      shortcut: '/icons/icon-192.png',
      apple: '/icons/icon-192.png',
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: appUrl,
      siteName: 'Yidak',
      locale: locale === 'ar' ? 'ar_AE' : 'en_AE',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: appUrl,
      languages: {
        en: '/en',
        ar: '/ar',
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
};

const LocaleLayout = async ({
  children,
  params,
}: LocaleLayoutProps): Promise<React.JSX.Element> => {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const messages = await getMessages();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  const fontClass = locale === 'ar' ? 'font-arabic' : 'font-sans';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yidak.app';

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Yidak',
    url: appUrl,
    logo: `${appUrl}/icons/icon-512.png`,
    areaServed: ['AE', 'SA', 'QA', 'BH', 'KW', 'OM'],
  };

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Yidak',
    url: appUrl,
    image: `${appUrl}/icons/icon-512.png`,
    description: t('description'),
    areaServed: ['Dubai', 'Riyadh', 'Doha', 'Manama', 'Kuwait City', 'Muscat'],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does Yidak work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Customers post a job with a budget, workers bid down, and customers hire the best option.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is payment in Yidak Shariah compliant?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yidak uses a Shariah-compliant escrow hold and release flow for job payments.',
        },
      },
    ],
  };

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${ibmPlexArabic.variable} ${fontClass} antialiased`}
      >
        <PwaRegister />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <TRPCProvider>
              {children}
              <Toaster richColors position="top-center" />
            </TRPCProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default LocaleLayout;
