import { describe, expect, it, vi } from 'vitest';

import { formatDate, formatRelativeTime, getNextPrayerTime, isWithinPrayerTime } from './date';

describe('date utilities', () => {
  it('formats Gregorian date in English', () => {
    const output = formatDate(new Date('2026-01-01T00:00:00.000Z'), 'en', 'gregory');
    expect(output.length).toBeGreaterThan(0);
  });

  it('formats Hijri date in Arabic', () => {
    const output = formatDate(new Date('2026-01-01T00:00:00.000Z'), 'ar', 'islamic-umalqura');
    expect(output.length).toBeGreaterThan(0);
  });

  it('formats relative time in English and Arabic', () => {
    const now = new Date('2026-02-15T10:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const inTwoHours = new Date('2026-02-15T12:00:00.000Z');
    expect(formatRelativeTime(inTwoHours, 'en')).toContain('hour');
    expect(formatRelativeTime(inTwoHours, 'ar').length).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  it('detects prayer time windows', () => {
    const sample = new Date('2026-02-15T05:00:00.000Z');
    const result = isWithinPrayerTime(sample, 25.2, 55.27);
    expect(typeof result).toBe('boolean');
  });

  it('returns the next prayer time', () => {
    const next = getNextPrayerTime(25.2, 55.27);
    expect(next.name.length).toBeGreaterThan(0);
    expect(next.time instanceof Date).toBe(true);
  });
});
