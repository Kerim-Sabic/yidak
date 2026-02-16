import { CategoryIdSchema, CreateJobInputSchema, type CreateJobInput } from '@yidak/types';
import { z } from 'zod';

import type { JobPostFormValues } from './types';

export const JobPostFormSchema = z
  .object({
    category_id: z.string().uuid(),
    title: z.string().min(5).max(200),
    description: z.string().min(20).max(5000),
    photos: z.array(z.string().url()).max(10),
    preferred_gender: z.enum(['any', 'male', 'female']),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      address: z.string().min(5).max(500),
      city: z.string().min(1).max(100),
      area: z.string().max(100),
      building: z.string().max(200),
      country: z.enum(['AE', 'SA', 'QA', 'BH', 'KW', 'OM'])
    }),
    budget_min: z.number().positive(),
    budget_max: z.number().positive(),
    urgency: z.enum(['flexible', 'normal', 'urgent', 'emergency']),
    schedule_mode: z.enum(['asap', 'scheduled']),
    scheduled_date: z.string(),
    scheduled_time: z.string(),
    accepted_terms: z.boolean()
  })
  .superRefine((value, context) => {
    if (value.budget_max < value.budget_min) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['budget_max'],
        message: 'Maximum budget must be >= minimum budget'
      });
    }

    if (value.schedule_mode === 'scheduled' && (!value.scheduled_date || !value.scheduled_time)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduled_date'],
        message: 'Scheduled date and time are required'
      });
    }

    if (!value.accepted_terms) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['accepted_terms'],
        message: 'Terms must be accepted before posting'
      });
    }
  });

const toScheduledDate = (dateText: string, timeText: string): Date | undefined => {
  if (!dateText || !timeText) {
    return undefined;
  }

  const value = new Date(`${dateText}T${timeText}:00`);
  if (Number.isNaN(value.getTime())) {
    return undefined;
  }

  return value;
};

export const toCreateJobInput = (values: JobPostFormValues): CreateJobInput => {
  const scheduledDate =
    values.schedule_mode === 'scheduled'
      ? toScheduledDate(values.scheduled_date, values.scheduled_time)
      : undefined;

  return CreateJobInputSchema.parse({
    title: values.title,
    description: values.description,
    category_id: CategoryIdSchema.parse(values.category_id),
    location: {
      latitude: values.location.latitude,
      longitude: values.location.longitude,
      address: values.location.address,
      city: values.location.city,
      area: values.location.area || undefined,
      building: values.location.building || undefined,
      country: values.location.country
    },
    budget_min: values.budget_min,
    budget_max: values.budget_max,
    urgency: values.urgency,
    scheduled_date: scheduledDate,
    photos: values.photos,
    preferred_gender: values.preferred_gender
  });
};

export type JobPostFormSchemaType = z.infer<typeof JobPostFormSchema>;
