'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import {
  COUNTRY_DIAL_CODE,
  type CountryCode,
  type SignupRole
} from '@/components/blocks/auth/constants';
import { normalizePhoneForCountry } from '@/components/blocks/auth/phone-utils';
import { createClient } from '@/lib/supabase/server';
import { ROLE_DASHBOARD_PATH, type Locale, type ProfileRole } from '@/lib/supabase/types';

export interface OtpRequestState {
  status: 'idle' | 'sent' | 'error';
  messageKey: string | null;
  country: CountryCode;
  phone: string;
  resendAt: number | null;
}

export interface OtpVerifyState {
  status: 'idle' | 'success' | 'error';
  messageKey: string | null;
  redirectPath: string | null;
}

export interface ProfileSetupState {
  status: 'idle' | 'success' | 'error';
  messageKey: string | null;
  redirectPath: string | null;
}

const countryEnum = z.enum(['AE', 'SA', 'QA', 'BH', 'KW', 'OM']);
const localeEnum = z.enum(['en', 'ar']);
const roleEnum = z.enum(['customer', 'worker']);

const SendOtpSchema = z.object({
  country: countryEnum,
  phone: z.string().min(6).max(16),
  role: roleEnum.default('customer'),
  city: z.string().max(100).default('')
});

const VerifyOtpSchema = z.object({
  country: countryEnum,
  phone: z.string().min(6).max(16),
  code: z.string().length(6).regex(/^\d+$/),
  locale: localeEnum
});

const ProfileSetupSchema = z.object({
  locale: localeEnum,
  role: roleEnum,
  country: countryEnum,
  fullName: z.string().min(2).max(120),
  city: z.string().min(1).max(120),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(1200).optional(),
  skills: z.array(z.string().min(1).max(100)).max(20),
  hourlyMin: z.number().nonnegative(),
  hourlyMax: z.number().nonnegative()
});

const SocialProviderSchema = z.object({
  provider: z.enum(['google', 'apple']),
  locale: localeEnum
});

const readString = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
};

const parseSkills = (formData: FormData): ReadonlyArray<string> =>
  formData
    .getAll('skills')
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const toDashboardPath = (locale: Locale, role: ProfileRole): string => `/${locale}${ROLE_DASHBOARD_PATH[role]}`;

const toRole = (value: string | null): ProfileRole => {
  if (value === 'worker' || value === 'admin') {
    return value;
  }

  return 'customer';
};

const readProfileRole = (profile: unknown): string | null => {
  if (!profile || typeof profile !== 'object') {
    return null;
  }

  const value = Reflect.get(profile, 'role');
  return typeof value === 'string' ? value : null;
};

const defaultRequestState: OtpRequestState = {
  status: 'idle',
  messageKey: null,
  country: 'AE',
  phone: '',
  resendAt: null
};

export const sendOtpAction = async (_: OtpRequestState, formData: FormData): Promise<OtpRequestState> => {
  const parsed = SendOtpSchema.safeParse({
    country: readString(formData, 'country'),
    phone: readString(formData, 'phone'),
    role: readString(formData, 'role'),
    city: readString(formData, 'city')
  });

  if (!parsed.success) {
    return { ...defaultRequestState, status: 'error', messageKey: 'validation.phone' };
  }

  const input = parsed.data;
  const supabase = await createClient();
  const normalizedPhone = normalizePhoneForCountry(input.country, input.phone);

  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
    options: {
      shouldCreateUser: true,
      data: {
        role: input.role,
        country: input.country,
        city: input.city,
        dial_code: COUNTRY_DIAL_CODE[input.country]
      }
    }
  });

  if (error) {
    return {
      status: 'error',
      messageKey: 'errors.generic',
      country: input.country,
      phone: input.phone,
      resendAt: null
    };
  }

  return {
    status: 'sent',
    messageKey: 'messages.otpSent',
    country: input.country,
    phone: input.phone,
    resendAt: Date.now() + 60_000
  };
};

export const verifyOtpAction = async (_: OtpVerifyState, formData: FormData): Promise<OtpVerifyState> => {
  const parsed = VerifyOtpSchema.safeParse({
    country: readString(formData, 'country'),
    phone: readString(formData, 'phone'),
    code: readString(formData, 'code'),
    locale: readString(formData, 'locale')
  });

  if (!parsed.success) {
    return { status: 'error', messageKey: 'errors.invalidOtp', redirectPath: null };
  }

  const { country, phone, code, locale } = parsed.data;
  const supabase = await createClient();
  const normalizedPhone = normalizePhoneForCountry(country, phone);

  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizedPhone,
    token: code,
    type: 'sms'
  });

  if (error || !data.user) {
    return { status: 'error', messageKey: 'errors.invalidOtp', redirectPath: null };
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('auth_id', data.user.id).single();
  const role = readProfileRole(profile);

  return {
    status: 'success',
    messageKey: 'messages.loggedIn',
    redirectPath: toDashboardPath(locale, toRole(role))
  };
};

export const completeProfileAction = async (
  _: ProfileSetupState,
  formData: FormData
): Promise<ProfileSetupState> => {
  const parsed = ProfileSetupSchema.safeParse({
    locale: readString(formData, 'locale'),
    role: readString(formData, 'role'),
    country: readString(formData, 'country'),
    fullName: readString(formData, 'fullName'),
    city: readString(formData, 'city'),
    avatarUrl: readString(formData, 'avatarUrl') || undefined,
    bio: readString(formData, 'bio') || undefined,
    skills: parseSkills(formData),
    hourlyMin: Number(readString(formData, 'hourlyMin')),
    hourlyMax: Number(readString(formData, 'hourlyMax'))
  });

  if (!parsed.success || parsed.data.hourlyMax < parsed.data.hourlyMin) {
    return { status: 'error', messageKey: 'errors.profile', redirectPath: null };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: 'error', messageKey: 'errors.generic', redirectPath: null };
  }

  const input = parsed.data;
  const metadata = {
    onboarding: {
      role: input.role,
      skills: input.skills,
      bio: input.bio ?? null,
      hourly_rate_min: input.hourlyMin,
      hourly_rate_max: input.hourlyMax
    }
  };

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName,
      city: input.city,
      country: input.country,
      role: input.role,
      avatar_url: input.avatarUrl ?? null,
      metadata
    })
    .eq('auth_id', user.id);

  if (error) {
    return { status: 'error', messageKey: 'errors.profile', redirectPath: null };
  }

  return {
    status: 'success',
    messageKey: 'messages.profileSaved',
    redirectPath: toDashboardPath(input.locale, input.role)
  };
};

export const startSocialLoginAction = async (formData: FormData): Promise<void> => {
  const parsed = SocialProviderSchema.safeParse({
    provider: readString(formData, 'provider'),
    locale: readString(formData, 'locale')
  });

  if (!parsed.success) {
    redirect('/en/login?error=provider');
  }

  const input = parsed.data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: input.provider,
    options: {
      redirectTo: `${appUrl}/${input.locale}/verify`
    }
  });

  if (error || !data.url) {
    redirect(`/${input.locale}/login?error=oauth`);
  }

  redirect(data.url);
};

export const requestStateInitial: OtpRequestState = defaultRequestState;
export const verifyStateInitial: OtpVerifyState = {
  status: 'idle',
  messageKey: null,
  redirectPath: null
};
export const profileStateInitial: ProfileSetupState = {
  status: 'idle',
  messageKey: null,
  redirectPath: null
};

export type { Locale, SignupRole };
