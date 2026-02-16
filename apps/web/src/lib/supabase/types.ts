export type ProfileRole = 'customer' | 'worker' | 'admin';

export interface ProfileRow {
  id: string;
  auth_id: string;
  role: ProfileRole;
  full_name: string;
  phone: string;
  email: string | null;
  avatar_url: string | null;
  country: 'AE' | 'SA' | 'QA' | 'BH' | 'KW' | 'OM';
  city: string;
  language: string;
  is_verified: boolean;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type Locale = 'en' | 'ar';

export const ROLE_DASHBOARD_PATH: Readonly<Record<ProfileRole, string>> = {
  customer: '/customer/dashboard',
  worker: '/worker/dashboard',
  admin: '/admin/dashboard'
};
