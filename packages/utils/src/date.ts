type SupportedLocale = 'en' | 'ar';
type SupportedCalendar = 'gregory' | 'islamic-umalqura';

type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

type PrayerSlot = {
  readonly name: PrayerName;
  readonly time: Date;
};

const minuteMs = 60_000;
const prayerWindowMs = 20 * minuteMs;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const offsetFromCoordinates = (latitude: number, longitude: number): number => {
  const latOffset = clamp(latitude / 15, -2, 2);
  const lonOffset = clamp(longitude / 30, -2, 2);

  return Math.round((latOffset + lonOffset) * 15);
};

const atMinutes = (base: Date, totalMinutes: number): Date => {
  const next = new Date(base);
  next.setHours(0, 0, 0, 0);
  next.setMinutes(totalMinutes, 0, 0);

  return next;
};

const buildPrayerSchedule = (date: Date, latitude: number, longitude: number): readonly PrayerSlot[] => {
  const coordinateOffset = offsetFromCoordinates(latitude, longitude);

  const schedule: readonly PrayerSlot[] = [
    { name: 'Fajr', time: atMinutes(date, 300 + coordinateOffset) },
    { name: 'Dhuhr', time: atMinutes(date, 735 + coordinateOffset) },
    { name: 'Asr', time: atMinutes(date, 930 + coordinateOffset) },
    { name: 'Maghrib', time: atMinutes(date, 1095 + coordinateOffset) },
    { name: 'Isha', time: atMinutes(date, 1185 + coordinateOffset) }
  ];

  return schedule;
};

export const formatDate = (
  date: Date,
  locale: SupportedLocale,
  calendar: SupportedCalendar = 'gregory'
): string => {
  const localeTag = `${locale}-u-ca-${calendar}`;

  return new Intl.DateTimeFormat(localeTag, {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

export const formatRelativeTime = (date: Date, locale: SupportedLocale): string => {
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const deltaMs = date.getTime() - Date.now();
  const deltaMinutes = Math.round(deltaMs / minuteMs);

  if (Math.abs(deltaMinutes) < 60) {
    return formatter.format(deltaMinutes, 'minute');
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  if (Math.abs(deltaHours) < 24) {
    return formatter.format(deltaHours, 'hour');
  }

  const deltaDays = Math.round(deltaHours / 24);
  return formatter.format(deltaDays, 'day');
};

export const isWithinPrayerTime = (date: Date, latitude: number, longitude: number): boolean => {
  const schedule = buildPrayerSchedule(date, latitude, longitude);

  return schedule.some((slot) => Math.abs(slot.time.getTime() - date.getTime()) <= prayerWindowMs);
};

export const getNextPrayerTime = (
  latitude: number,
  longitude: number
): { name: string; time: Date } => {
  const now = new Date();
  const todaySchedule = buildPrayerSchedule(now, latitude, longitude);

  const upcoming = todaySchedule.find((slot) => slot.time.getTime() > now.getTime());
  if (upcoming) {
    return { name: upcoming.name, time: upcoming.time };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowSchedule = buildPrayerSchedule(tomorrow, latitude, longitude);
  const firstPrayer = tomorrowSchedule[0] ?? { name: 'Fajr', time: atMinutes(tomorrow, 300) };

  return { name: firstPrayer.name, time: firstPrayer.time };
};
