import { TRPCError } from '@trpc/server';
import { JobIdSchema, UserIdSchema } from '@yidak/types';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure, publicProcedure } from '../middleware';

import type { Context } from '../context';

const ratingSchema = z.number().int().min(1).max(5);

const createReviewInputSchema = z.object({
  job_id: JobIdSchema,
  rating: ratingSchema,
  quality_rating: ratingSchema.optional(),
  timeliness_rating: ratingSchema.optional(),
  communication_rating: ratingSchema,
  value_rating: ratingSchema.optional(),
  cleanliness_rating: ratingSchema.optional(),
  comment: z.string().min(20).max(1000).optional(),
  photos: z.array(z.string().url()).max(5).default([]),
  tip_amount: z.number().nonnegative().optional(),
});

const reviewerSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  avatar_url: z.string().nullable(),
});

const reviewOutputSchema = z.object({
  id: z.string().uuid(),
  job_id: z.string().uuid(),
  reviewer_id: z.string().uuid(),
  reviewee_id: z.string().uuid(),
  rating: ratingSchema,
  quality_rating: ratingSchema,
  timeliness_rating: ratingSchema,
  communication_rating: ratingSchema,
  value_rating: ratingSchema,
  cleanliness_rating: ratingSchema,
  comment: z.string().nullable(),
  photos: z.array(z.string()),
  response: z.string().nullable(),
  responded_at: z.string().nullable(),
  created_at: z.string(),
  reviewer: reviewerSchema.nullable(),
  helpful_up: z.number().int().nonnegative(),
  helpful_down: z.number().int().nonnegative(),
});

const getForUserInputSchema = z.object({
  user_id: UserIdSchema,
  cursor: z.string().uuid().optional(),
  limit: z.number().int().positive().max(50).default(20),
});

const forUserOutputSchema = z.object({
  items: z.array(reviewOutputSchema),
  averages: z.object({
    overall: z.number().nonnegative(),
    quality: z.number().nonnegative(),
    timeliness: z.number().nonnegative(),
    communication: z.number().nonnegative(),
    value: z.number().nonnegative(),
    cleanliness: z.number().nonnegative(),
  }),
  distribution: z.object({
    five: z.number().int().nonnegative(),
    four: z.number().int().nonnegative(),
    three: z.number().int().nonnegative(),
    two: z.number().int().nonnegative(),
    one: z.number().int().nonnegative(),
  }),
  total_reviews: z.number().int().nonnegative(),
  nextCursor: z.string().nullable(),
});

const respondInputSchema = z.object({
  review_id: z.string().uuid(),
  response: z.string().min(2).max(1000),
});

const readString = (row: Record<string, unknown>, key: string): string => {
  const value = Reflect.get(row, key);
  return typeof value === 'string' ? value : '';
};

const readNullableString = (row: Record<string, unknown>, key: string): string | null => {
  const value = Reflect.get(row, key);
  return typeof value === 'string' ? value : null;
};

const readNumber = (row: Record<string, unknown>, key: string): number => {
  const value = Reflect.get(row, key);
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
};

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const rows = (value: unknown): ReadonlyArray<Record<string, unknown>> =>
  Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    : [];

const computeAverage = (values: ReadonlyArray<number>): number => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const createProfileFetcher = (ctx: Context) => {
  const cache = new Map<string, Record<string, unknown> | null>();

  return async (profileId: string): Promise<Record<string, unknown> | null> => {
    const cached = cache.get(profileId);
    if (cached !== undefined) {
      return cached;
    }

    const result = await ctx.supabase.from('profiles').select('*').eq('id', profileId).single();
    const profileRow =
      result.data && typeof result.data === 'object' && !Array.isArray(result.data)
        ? result.data
        : null;

    cache.set(profileId, profileRow);
    return profileRow;
  };
};

const toReview = async (
  row: Record<string, unknown>,
  fetchProfile: (profileId: string) => Promise<Record<string, unknown> | null>,
): Promise<z.infer<typeof reviewOutputSchema>> => {
  const reviewerId = readString(row, 'reviewer_id');
  const reviewer = reviewerId ? await fetchProfile(reviewerId) : null;

  return {
    id: readString(row, 'id'),
    job_id: readString(row, 'job_id'),
    reviewer_id: reviewerId,
    reviewee_id: readString(row, 'reviewee_id'),
    rating: Math.max(1, Math.min(5, Math.round(readNumber(row, 'rating')))),
    quality_rating: Math.max(1, Math.min(5, Math.round(readNumber(row, 'quality_rating')))),
    timeliness_rating: Math.max(1, Math.min(5, Math.round(readNumber(row, 'timeliness_rating')))),
    communication_rating: Math.max(
      1,
      Math.min(5, Math.round(readNumber(row, 'communication_rating'))),
    ),
    value_rating: Math.max(1, Math.min(5, Math.round(readNumber(row, 'value_rating')))),
    cleanliness_rating: Math.max(1, Math.min(5, Math.round(readNumber(row, 'cleanliness_rating')))),
    comment: readNullableString(row, 'comment'),
    photos: readStringArray(Reflect.get(row, 'photos')),
    response: readNullableString(row, 'response'),
    responded_at: readNullableString(row, 'responded_at'),
    created_at: readString(row, 'created_at'),
    reviewer: reviewer
      ? {
          id: readString(reviewer, 'id'),
          full_name: readString(reviewer, 'full_name'),
          avatar_url: readNullableString(reviewer, 'avatar_url'),
        }
      : null,
    helpful_up: 0,
    helpful_down: 0,
  };
};

const buildDistribution = (inputRows: ReadonlyArray<Record<string, unknown>>) => {
  const counts = {
    five: 0,
    four: 0,
    three: 0,
    two: 0,
    one: 0,
  };

  inputRows.forEach((row) => {
    const rating = Math.round(readNumber(row, 'rating'));
    if (rating === 5) {
      counts.five += 1;
      return;
    }

    if (rating === 4) {
      counts.four += 1;
      return;
    }

    if (rating === 3) {
      counts.three += 1;
      return;
    }

    if (rating === 2) {
      counts.two += 1;
      return;
    }

    counts.one += 1;
  });

  return counts;
};

export const reviewRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createReviewInputSchema)
    .output(reviewOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const jobResult = await ctx.supabase.from('jobs').select('*').eq('id', input.job_id).single();
      const jobRow =
        jobResult.data && typeof jobResult.data === 'object' && !Array.isArray(jobResult.data)
          ? jobResult.data
          : null;

      if (!jobRow) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
      }

      const status = readString(jobRow, 'status');
      if (status !== 'completed' && status !== 'reviewed') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Job must be completed before review',
        });
      }

      const customerId = readString(jobRow, 'customer_id');
      const workerId = readNullableString(jobRow, 'assigned_worker_id');
      const reviewerId = ctx.profile.id;
      const revieweeId = reviewerId === customerId ? workerId : customerId;
      const reviewerIsParticipant = reviewerId === customerId || reviewerId === workerId;

      if (!revieweeId || !reviewerIsParticipant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only participants can review this job',
        });
      }

      const existing = await ctx.supabase
        .from('reviews')
        .select('*')
        .eq('job_id', input.job_id)
        .eq('reviewer_id', reviewerId)
        .maybeSingle();

      if (existing.data) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Review already exists' });
      }

      const qualityRating = input.quality_rating ?? input.rating;
      const timelinessRating = input.timeliness_rating ?? input.rating;
      const valueRating = input.value_rating ?? input.rating;
      const cleanlinessRating = input.cleanliness_rating ?? input.rating;

      const insert = await ctx.supabase
        .from('reviews')
        .insert({
          job_id: input.job_id,
          reviewer_id: reviewerId,
          reviewee_id: revieweeId,
          rating: input.rating,
          quality_rating: qualityRating,
          timeliness_rating: timelinessRating,
          communication_rating: input.communication_rating,
          value_rating: valueRating,
          cleanliness_rating: cleanlinessRating,
          comment: input.comment ?? null,
          photos: input.photos,
        })
        .select('*')
        .single();

      const insertedRow =
        insert.data && typeof insert.data === 'object' && !Array.isArray(insert.data)
          ? insert.data
          : null;

      if (!insertedRow) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to create review' });
      }

      await ctx.supabase
        .from('jobs')
        .update({ status: 'reviewed', reviewed_at: new Date().toISOString() })
        .eq('id', input.job_id);

      const fetchProfile = createProfileFetcher(ctx);
      return toReview(insertedRow, fetchProfile);
    }),

  getForJob: publicProcedure
    .input(JobIdSchema)
    .output(z.array(reviewOutputSchema))
    .query(async ({ ctx, input }) => {
      const reviewResult = await ctx.supabase
        .from('reviews')
        .select('*')
        .eq('job_id', input)
        .order('created_at', { ascending: false });

      const fetchProfile = createProfileFetcher(ctx);
      return Promise.all(rows(reviewResult.data).map((row) => toReview(row, fetchProfile)));
    }),

  getForUser: publicProcedure
    .input(getForUserInputSchema)
    .output(forUserOutputSchema)
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', input.user_id)
        .order('created_at', { ascending: false })
        .limit(input.limit + 1);

      if (input.cursor) {
        const cursorResult = await ctx.supabase
          .from('reviews')
          .select('*')
          .eq('id', input.cursor)
          .single();
        const cursorRow =
          cursorResult.data &&
          typeof cursorResult.data === 'object' &&
          !Array.isArray(cursorResult.data)
            ? cursorResult.data
            : null;
        const cursorCreatedAt = cursorRow ? readString(cursorRow, 'created_at') : '';

        if (cursorCreatedAt) {
          query = query.lt('created_at', cursorCreatedAt);
        }
      }

      const result = await query;
      const allRows = rows(result.data);
      const pageRows = allRows.slice(0, input.limit);
      const nextCursor =
        allRows.length > input.limit ? readString(pageRows[pageRows.length - 1] ?? {}, 'id') : null;

      const allForAverages = await ctx.supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', input.user_id);
      const averageRows = rows(allForAverages.data);
      const fetchProfile = createProfileFetcher(ctx);

      return {
        items: await Promise.all(pageRows.map((row) => toReview(row, fetchProfile))),
        averages: {
          overall: computeAverage(averageRows.map((row) => readNumber(row, 'rating'))),
          quality: computeAverage(averageRows.map((row) => readNumber(row, 'quality_rating'))),
          timeliness: computeAverage(
            averageRows.map((row) => readNumber(row, 'timeliness_rating')),
          ),
          communication: computeAverage(
            averageRows.map((row) => readNumber(row, 'communication_rating')),
          ),
          value: computeAverage(averageRows.map((row) => readNumber(row, 'value_rating'))),
          cleanliness: computeAverage(
            averageRows.map((row) => readNumber(row, 'cleanliness_rating')),
          ),
        },
        distribution: buildDistribution(averageRows),
        total_reviews: averageRows.length,
        nextCursor,
      };
    }),

  respond: protectedProcedure
    .input(respondInputSchema)
    .output(z.object({ responded: z.literal(true), review_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const reviewResult = await ctx.supabase
        .from('reviews')
        .select('*')
        .eq('id', input.review_id)
        .single();
      const reviewRow =
        reviewResult.data &&
        typeof reviewResult.data === 'object' &&
        !Array.isArray(reviewResult.data)
          ? reviewResult.data
          : null;

      if (!reviewRow) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found' });
      }

      if (readString(reviewRow, 'reviewee_id') !== ctx.profile.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only reviewee can respond' });
      }

      await ctx.supabase
        .from('reviews')
        .update({ response: input.response, responded_at: new Date().toISOString() })
        .eq('id', input.review_id);

      return {
        responded: true,
        review_id: input.review_id,
      };
    }),
});
