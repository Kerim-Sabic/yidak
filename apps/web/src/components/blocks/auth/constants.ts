export const GCC_COUNTRIES = [
  { code: 'AE', dialCode: '+971', flag: '????' },
  { code: 'SA', dialCode: '+966', flag: '????' },
  { code: 'QA', dialCode: '+974', flag: '????' },
  { code: 'BH', dialCode: '+973', flag: '????' },
  { code: 'KW', dialCode: '+965', flag: '????' },
  { code: 'OM', dialCode: '+968', flag: '????' }
] as const;

export type CountryCode = (typeof GCC_COUNTRIES)[number]['code'];

export const ROLE_OPTIONS = ['customer', 'worker'] as const;
export type SignupRole = (typeof ROLE_OPTIONS)[number];

export const CITY_KEYS = [
  'dubai',
  'abuDhabi',
  'sharjah',
  'riyadh',
  'jeddah',
  'doha',
  'manama',
  'kuwaitCity',
  'muscat',
  'dammam',
  'alAin',
  'salalah'
] as const;

export type CityKey = (typeof CITY_KEYS)[number];

export const SKILL_KEYS = [
  'plumbing',
  'electrical',
  'acHvac',
  'painting',
  'carpentry',
  'cleaning',
  'applianceRepair',
  'smartHome'
] as const;

export type SkillKey = (typeof SKILL_KEYS)[number];

export const COUNTRY_DIAL_CODE: Readonly<Record<CountryCode, string>> = {
  AE: '+971',
  SA: '+966',
  QA: '+974',
  BH: '+973',
  KW: '+965',
  OM: '+968'
};
