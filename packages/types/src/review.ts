import { z } from 'zod';

import { JobIdSchema, ReviewIdSchema, UserIdSchema } from './ids';

const RatingSchema = z.number().int().min(1).max(5);

export const CreateReviewInputSchema = z.object({
  job_id: JobIdSchema,
  reviewee_id: UserIdSchema,
  rating: RatingSchema,
  quality_rating: RatingSchema.optional(),
  timeliness_rating: RatingSchema.optional(),
  communication_rating: RatingSchema,
  value_rating: RatingSchema.optional(),
  cleanliness_rating: RatingSchema.optional(),
  comment: z.string().max(2000).optional(),
  tip_amount: z.number().nonnegative().optional(),
  photos: z.array(z.string().url()).max(5).default([])
});

export const ReviewSchema = z.object({
  id: ReviewIdSchema,
  job_id: JobIdSchema,
  reviewer_id: UserIdSchema,
  reviewee_id: UserIdSchema,
  rating: RatingSchema,
  quality_rating: RatingSchema,
  timeliness_rating: RatingSchema,
  communication_rating: RatingSchema,
  value_rating: RatingSchema,
  cleanliness_rating: RatingSchema,
  comment: z.string().nullable(),
  photos: z.array(z.string().url()),
  response: z.string().nullable(),
  responded_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type CreateReviewInput = z.infer<typeof CreateReviewInputSchema>;
export type Review = z.infer<typeof ReviewSchema>;
