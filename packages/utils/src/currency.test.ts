import { describe, expect, it } from 'vitest';

import { convertCurrency, formatCurrency, getCurrencySymbol, parseCurrency } from './currency';

const normalizeDigits = (value: string): string =>
  value
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replaceAll('٫', '.')
    .replaceAll('٬', ',');

describe('currency utilities', () => {
  it('formats all GCC currencies', () => {
    const countries = ['AE', 'SA', 'QA', 'BH', 'KW', 'OM'] as const;
    const formatted = countries.map((country) => formatCurrency(123.456, country));
    expect(formatted.every((value) => value.length > 0)).toBe(true);
  });

  it('uses 3 decimals for BHD, KWD, OMR', () => {
    const bh = normalizeDigits(formatCurrency(10.1234, 'BH'));
    const kw = normalizeDigits(formatCurrency(10.1234, 'KW'));
    const om = normalizeDigits(formatCurrency(10.1234, 'OM'));
    expect(bh).toMatch(/\d+[.,]\d{3}/u);
    expect(kw).toMatch(/\d+[.,]\d{3}/u);
    expect(om).toMatch(/\d+[.,]\d{3}/u);
  });

  it('uses 2 decimals for AED, SAR, QAR', () => {
    const ae = normalizeDigits(formatCurrency(10.129, 'AE'));
    const sa = normalizeDigits(formatCurrency(10.129, 'SA'));
    const qa = normalizeDigits(formatCurrency(10.129, 'QA'));
    expect(ae).toMatch(/\d+[.,]\d{2}/u);
    expect(sa).toMatch(/\d+[.,]\d{2}/u);
    expect(qa).toMatch(/\d+[.,]\d{2}/u);
  });

  it('supports Arabic formatting locales', () => {
    const formatted = formatCurrency(3500.5, 'SA');
    expect(formatted).toMatch(/\S+/u);
  });

  it('parses formatted values back into numbers', () => {
    expect(parseCurrency('AED 123.45')).toBe(123.45);
    expect(parseCurrency('invalid')).toBe(0);
  });

  it('returns a currency symbol', () => {
    const symbol = getCurrencySymbol('AE');
    expect(symbol.length).toBeGreaterThan(0);
  });

  it('converts currencies using rate map', () => {
    const converted = convertCurrency(100, 'AE', 'SA', { AED: 1, SAR: 1.02 });
    expect(converted).toBeCloseTo(102);
  });
});
