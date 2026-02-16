import { GCCCurrency, type GCCCountry } from '@yidak/types';

const countryToCurrency: Readonly<Record<GCCCountry, string>> = {
  AE: GCCCurrency.AE,
  SA: GCCCurrency.SA,
  QA: GCCCurrency.QA,
  BH: GCCCurrency.BH,
  KW: GCCCurrency.KW,
  OM: GCCCurrency.OM
};

const threeDecimals = new Set<string>([GCCCurrency.BH, GCCCurrency.KW, GCCCurrency.OM]);

const formatterLocaleByCountry: Readonly<Record<GCCCountry, string>> = {
  AE: 'en-AE',
  SA: 'ar-SA',
  QA: 'ar-QA',
  BH: 'ar-BH',
  KW: 'ar-KW',
  OM: 'ar-OM'
};

const toCurrencyCode = (country: GCCCountry): string => countryToCurrency[country];

const getFractionDigits = (currency: string): number => (threeDecimals.has(currency) ? 3 : 2);

export const formatCurrency = (amount: number, country: GCCCountry): string => {
  const currency = toCurrencyCode(country);
  const minimumFractionDigits = getFractionDigits(currency);

  return new Intl.NumberFormat(formatterLocaleByCountry[country], {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits
  }).format(amount);
};

export const parseCurrency = (formatted: string): number => {
  const normalized = formatted.replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);

  return Number.isNaN(parsed) ? 0 : parsed;
};

export const getCurrencySymbol = (country: GCCCountry): string => {
  const currency = toCurrencyCode(country);
  const parts = new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol'
  }).formatToParts(1);
  const part = parts.find((value) => value.type === 'currency');

  return part?.value ?? currency;
};

export const convertCurrency = (
  amount: number,
  from: GCCCountry,
  to: GCCCountry,
  rates: Record<string, number>
): number => {
  const fromCurrency = toCurrencyCode(from);
  const toCurrency = toCurrencyCode(to);
  const fromRate = rates[fromCurrency] ?? 1;
  const toRate = rates[toCurrency] ?? 1;

  if (fromRate <= 0 || toRate <= 0) {
    return amount;
  }

  const baseAmount = amount / fromRate;

  return baseAmount * toRate;
};
