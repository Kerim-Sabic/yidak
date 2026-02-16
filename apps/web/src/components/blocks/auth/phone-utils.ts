import { COUNTRY_DIAL_CODE, type CountryCode } from '@/components/blocks/auth/constants';

const NON_DIGIT_REGEX = /\D/g;

const trimLeadingZeroes = (value: string): string => value.replace(/^0+/, '');

export const normalizePhoneForCountry = (country: CountryCode, phone: string): string => {
  const dialCode = COUNTRY_DIAL_CODE[country];
  const digitsOnly = trimLeadingZeroes(phone.replace(NON_DIGIT_REGEX, ''));
  return `${dialCode}${digitsOnly}`;
};

export const formatPhoneDigits = (value: string): string => {
  const digits = value.replace(NON_DIGIT_REGEX, '');
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 9), digits.slice(9, 12)];

  return parts.filter((part) => part.length > 0).join(' ');
};
