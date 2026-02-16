import { z } from 'zod';

import { GCCCountry, UserRole, WorkerTier } from './enums';
import { UserIdSchema } from './ids';

export const CreateUserInputSchema = z.object({
  role: z.nativeEnum(UserRole).default('customer'),
  full_name: z.string().min(2).max(150),
  phone: z.string().min(7).max(20),
  email: z.string().email().optional(),
  country: z.nativeEnum(GCCCountry),
  city: z.string().min(1).max(100),
  language: z.enum(['en', 'ar']).default('en')
});

export const UserSchema = z.object({
  id: UserIdSchema,
  auth_id: z.string().uuid(),
  role: z.nativeEnum(UserRole),
  full_name: z.string().min(2),
  phone: z.string(),
  email: z.string().email().nullable(),
  avatar_url: z.string().url().nullable(),
  country: z.nativeEnum(GCCCountry),
  city: z.string(),
  language: z.enum(['en', 'ar']),
  is_verified: z.boolean(),
  is_active: z.boolean(),
  metadata: z.record(z.unknown()).nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  deleted_at: z.coerce.date().nullable()
});

export const WorkerProfileSchema = z.object({
  user_id: UserIdSchema,
  bio: z.string().max(2000).nullable(),
  skills: z.array(z.string()),
  certifications: z.array(z.record(z.unknown())),
  portfolio_photos: z.array(z.string().url()),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  service_radius_km: z.number().positive(),
  hourly_rate_min: z.number().nonnegative(),
  hourly_rate_max: z.number().nonnegative(),
  tier: z.nativeEnum(WorkerTier),
  total_jobs: z.number().int().nonnegative(),
  total_reviews: z.number().int().nonnegative(),
  total_earnings: z.number().nonnegative(),
  average_rating: z.number().min(0).max(5),
  response_time_minutes: z.number().int().nonnegative(),
  completion_rate: z.number().min(0).max(100),
  is_available: z.boolean(),
  availability_schedule: z.record(z.unknown()).nullable(),
  verified_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type User = z.infer<typeof UserSchema>;
export type WorkerProfile = z.infer<typeof WorkerProfileSchema>;
