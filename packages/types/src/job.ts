import { z } from 'zod';

import { GCCCountry, JobStatus, UrgencyLevel } from './enums';
import { CategoryIdSchema, JobIdSchema, UserIdSchema } from './ids';

export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(5).max(500),
  city: z.string().min(1).max(100),
  area: z.string().max(100).optional(),
  building: z.string().max(200).optional(),
  country: z.nativeEnum(GCCCountry)
});

export const CreateJobInputSchema = z
  .object({
    title: z.string().min(5).max(200),
    description: z.string().min(20).max(5000),
    category_id: CategoryIdSchema,
    location: LocationSchema,
    budget_min: z.number().positive(),
    budget_max: z.number().positive(),
    urgency: z.nativeEnum(UrgencyLevel).default('normal'),
    scheduled_date: z.coerce.date().optional(),
    photos: z.array(z.string().url()).max(10).default([]),
    preferred_gender: z.enum(['any', 'male', 'female']).default('any')
  })
  .refine(
    (data) => data.budget_max >= data.budget_min,
    {
      message: 'Maximum budget must be >= minimum budget',
      path: ['budget_max']
    }
  );

export const JobSchema = z.object({
  id: JobIdSchema,
  customer_id: UserIdSchema,
  title: z.string(),
  description: z.string(),
  category_id: CategoryIdSchema,
  location: LocationSchema,
  budget_min: z.number(),
  budget_max: z.number(),
  urgency: z.nativeEnum(UrgencyLevel),
  status: z.nativeEnum(JobStatus),
  bid_count: z.number().int().nonnegative(),
  lowest_bid: z.number().nullable(),
  expires_at: z.coerce.date().nullable(),
  scheduled_date: z.coerce.date().nullable(),
  photos: z.array(z.string()),
  preferred_gender: z.enum(['any', 'male', 'female']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type CreateJobInput = z.infer<typeof CreateJobInputSchema>;
export type Job = z.infer<typeof JobSchema>;
