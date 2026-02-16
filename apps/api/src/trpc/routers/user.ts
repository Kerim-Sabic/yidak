import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure, publicProcedure, workerProcedure } from '../middleware';

const profileSchema = z.object({
  id: z.string().uuid(),
  auth_id: z.string().uuid(),
  role: z.enum(['customer', 'worker', 'admin']),
  full_name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  avatar_url: z.string().nullable(),
  country: z.enum(['AE', 'SA', 'QA', 'BH', 'KW', 'OM']),
  city: z.string(),
  language: z.string(),
  is_verified: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string()
});

const updateProfileInputSchema = z.object({
  full_name: z.string().min(2).max(150).optional(),
  avatar_url: z.string().url().nullable().optional(),
  city: z.string().min(1).max(100).optional(),
  language: z.enum(['en', 'ar']).optional()
});

const workerCertificationSchema = z.object({
  name: z.string(),
  issuer: z.string().nullable(),
  issued_at: z.string().nullable(),
  verified: z.boolean()
});

const portfolioItemSchema = z.object({
  id: z.string(),
  image_url: z.string().nullable(),
  before_url: z.string().nullable(),
  after_url: z.string().nullable(),
  video_url: z.string().nullable(),
  category: z.string(),
  date: z.string().nullable(),
  customer_rating: z.number().min(1).max(5).nullable()
});

const workerReviewSchema = z.object({
  id: z.string().uuid(),
  reviewer_id: z.string().uuid(),
  reviewer_name: z.string(),
  reviewer_avatar_url: z.string().nullable(),
  rating: z.number().min(1).max(5),
  quality_rating: z.number().min(1).max(5),
  timeliness_rating: z.number().min(1).max(5),
  communication_rating: z.number().min(1).max(5),
  value_rating: z.number().min(1).max(5),
  cleanliness_rating: z.number().min(1).max(5),
  comment: z.string().nullable(),
  photos: z.array(z.string()),
  response: z.string().nullable(),
  responded_at: z.string().nullable(),
  created_at: z.string(),
  helpful_up: z.number().int().nonnegative(),
  helpful_down: z.number().int().nonnegative()
});

const workerPublicOutputSchema = z.object({
  profile: profileSchema,
  worker_profile: z
    .object({
      bio: z.string().nullable(),
      skills: z.array(z.string()),
      certifications: z.array(workerCertificationSchema),
      portfolio_items: z.array(portfolioItemSchema),
      hourly_rate_min: z.number(),
      hourly_rate_max: z.number(),
      average_rating: z.number(),
      completion_rate: z.number(),
      total_jobs: z.number().int(),
      total_reviews: z.number().int(),
      response_time_minutes: z.number().int(),
      is_available: z.boolean(),
      tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
      service_radius_km: z.number(),
      location: z.string(),
      total_earnings: z.number(),
      on_time_rate: z.number(),
      repeat_customers: z.number().int(),
      member_since: z.string()
    })
    .nullable(),
  rating_breakdown: z.object({
    average: z.number().nonnegative(),
    total_reviews: z.number().int().nonnegative(),
    distribution: z.object({
      five: z.number().int().nonnegative(),
      four: z.number().int().nonnegative(),
      three: z.number().int().nonnegative(),
      two: z.number().int().nonnegative(),
      one: z.number().int().nonnegative()
    }),
    categories: z.object({
      quality: z.number().nonnegative(),
      timeliness: z.number().nonnegative(),
      communication: z.number().nonnegative(),
      value: z.number().nonnegative(),
      cleanliness: z.number().nonnegative()
    })
  }),
  reviews: z.array(workerReviewSchema),
  is_owner: z.boolean(),
  can_contact: z.boolean(),
  active_job_id: z.string().uuid().nullable()
});

const workerProfileUpdateInputSchema = z.object({
  bio: z.string().max(2000).optional(),
  skills: z.array(z.string()).max(30).optional(),
  portfolio_photos: z.array(z.string().url()).max(30).optional(),
  hourly_rate_min: z.number().nonnegative().optional(),
  hourly_rate_max: z.number().nonnegative().optional(),
  availability_schedule: z.record(z.unknown()).optional()
});

const toggleAvailabilityInputSchema = z.object({
  is_available: z.boolean().optional()
});

const dashboardStatsOutputSchema = z.union([
  z.object({
    role: z.literal('customer'),
    active_jobs: z.number().int().nonnegative(),
    total_spent: z.number().nonnegative(),
    average_savings: z.number().nonnegative()
  }),
  z.object({
    role: z.literal('worker'),
    total_earnings: z.number().nonnegative(),
    active_bids: z.number().int().nonnegative(),
    jobs_completed: z.number().int().nonnegative(),
    average_rating: z.number().nonnegative(),
    completion_rate: z.number().nonnegative(),
    tier_progress: z.number().nonnegative()
  }),
  z.object({
    role: z.literal('admin'),
    active_users: z.number().int().nonnegative(),
    active_jobs: z.number().int().nonnegative(),
    disputes_open: z.number().int().nonnegative()
  })
]);

const readString = (row: Record<string, unknown>, key: string): string => {
  const value = Reflect.get(row, key);
  return typeof value === 'string' ? value : '';
};

const readNullableString = (row: Record<string, unknown>, key: string): string | null => {
  const value = Reflect.get(row, key);
  return typeof value === 'string' ? value : null;
};

const readBoolean = (row: Record<string, unknown>, key: string): boolean => {
  const value = Reflect.get(row, key);
  return typeof value === 'boolean' ? value : false;
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

const toProfileSchema = (profile: Record<string, unknown>): z.infer<typeof profileSchema> => ({
  id: readString(profile, 'id'),
  auth_id: readString(profile, 'auth_id'),
  role:
    readString(profile, 'role') === 'worker'
      ? 'worker'
      : readString(profile, 'role') === 'admin'
        ? 'admin'
        : 'customer',
  full_name: readString(profile, 'full_name'),
  phone: readString(profile, 'phone'),
  email: readNullableString(profile, 'email'),
  avatar_url: readNullableString(profile, 'avatar_url'),
  country:
    readString(profile, 'country') === 'SA'
      ? 'SA'
      : readString(profile, 'country') === 'QA'
        ? 'QA'
        : readString(profile, 'country') === 'BH'
          ? 'BH'
          : readString(profile, 'country') === 'KW'
            ? 'KW'
            : readString(profile, 'country') === 'OM'
              ? 'OM'
              : 'AE',
  city: readString(profile, 'city'),
  language: readString(profile, 'language') || 'en',
  is_verified: readBoolean(profile, 'is_verified'),
  is_active: readBoolean(profile, 'is_active'),
  created_at: readString(profile, 'created_at'),
  updated_at: readString(profile, 'updated_at')
});

const computeAverage = (values: ReadonlyArray<number>): number => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const parseCertification = (value: unknown): z.infer<typeof workerCertificationSchema> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record: Record<string, unknown> = {};
  Object.entries(value).forEach(([key, item]) => {
    record[key] = item;
  });

  const name = typeof record.name === 'string' ? record.name : '';
  if (!name) {
    return null;
  }

  return {
    name,
    issuer: typeof record.issuer === 'string' ? record.issuer : null,
    issued_at: typeof record.issued_at === 'string' ? record.issued_at : null,
    verified: typeof record.verified === 'boolean' ? record.verified : false
  };
};

const normalizeTier = (value: string): 'bronze' | 'silver' | 'gold' | 'platinum' => {
  if (value === 'silver' || value === 'gold' || value === 'platinum') {
    return value;
  }

  return 'bronze';
};

const buildDistribution = (reviewRows: ReadonlyArray<Record<string, unknown>>) => {
  const distribution = {
    five: 0,
    four: 0,
    three: 0,
    two: 0,
    one: 0
  };

  reviewRows.forEach((reviewRow) => {
    const rating = Math.round(readNumber(reviewRow, 'rating'));
    if (rating === 5) {
      distribution.five += 1;
      return;
    }

    if (rating === 4) {
      distribution.four += 1;
      return;
    }

    if (rating === 3) {
      distribution.three += 1;
      return;
    }

    if (rating === 2) {
      distribution.two += 1;
      return;
    }

    distribution.one += 1;
  });

  return distribution;
};

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.output(profileSchema).query(({ ctx }) => toProfileSchema(ctx.profile)),

  updateProfile: protectedProcedure
    .input(updateProfileInputSchema)
    .output(profileSchema)
    .mutation(async ({ ctx, input }) => {
      const updatePayload: Record<string, unknown> = {};

      if (input.full_name !== undefined) {
        updatePayload.full_name = input.full_name;
      }

      if (input.avatar_url !== undefined) {
        updatePayload.avatar_url = input.avatar_url;
      }

      if (input.city !== undefined) {
        updatePayload.city = input.city;
      }

      if (input.language !== undefined) {
        updatePayload.language = input.language;
      }

      const result = await ctx.supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', ctx.profile.id)
        .select('*')
        .single();

      const profileRow =
        result.data && typeof result.data === 'object' && !Array.isArray(result.data) ? result.data : null;

      if (!profileRow) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to update profile' });
      }

      return toProfileSchema(profileRow);
    }),

  getWorkerProfile: publicProcedure
    .input(z.object({ user_id: z.string().uuid() }))
    .output(workerPublicOutputSchema)
    .query(async ({ ctx, input }) => {
      const profileResult = await ctx.supabase.from('profiles').select('*').eq('id', input.user_id).single();
      const profileRow =
        profileResult.data && typeof profileResult.data === 'object' && !Array.isArray(profileResult.data)
          ? profileResult.data
          : null;

      if (!profileRow || readString(profileRow, 'role') !== 'worker') {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Worker profile not found' });
      }

      const workerResult = await ctx.supabase
        .from('worker_profiles')
        .select('*')
        .eq('user_id', input.user_id)
        .single();
      const workerRow =
        workerResult.data && typeof workerResult.data === 'object' && !Array.isArray(workerResult.data)
          ? workerResult.data
          : null;

      const reviewResult = await ctx.supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', input.user_id)
        .order('created_at', { ascending: false })
        .limit(100);
      const reviewRows = rows(reviewResult.data);

      const reviewerIds = [...new Set(reviewRows.map((reviewRow) => readString(reviewRow, 'reviewer_id')))];
      const reviewerMap = new Map<string, Record<string, unknown>>();

      await Promise.all(
        reviewerIds.map(async (reviewerId) => {
          if (!reviewerId) {
            return;
          }

          const reviewerResult = await ctx.supabase
            .from('profiles')
            .select('*')
            .eq('id', reviewerId)
            .single();
          const reviewerRow =
            reviewerResult.data &&
            typeof reviewerResult.data === 'object' &&
            !Array.isArray(reviewerResult.data)
              ? reviewerResult.data
              : null;

          if (reviewerRow) {
            reviewerMap.set(reviewerId, reviewerRow);
          }
        })
      );

      const mappedReviews = reviewRows.map((reviewRow) => {
        const reviewerId = readString(reviewRow, 'reviewer_id');
        const reviewer = reviewerMap.get(reviewerId);

        return {
          id: readString(reviewRow, 'id'),
          reviewer_id: reviewerId,
          reviewer_name: reviewer ? readString(reviewer, 'full_name') : '',
          reviewer_avatar_url: reviewer ? readNullableString(reviewer, 'avatar_url') : null,
          rating: Math.max(1, Math.min(5, Math.round(readNumber(reviewRow, 'rating')))),
          quality_rating: Math.max(1, Math.min(5, Math.round(readNumber(reviewRow, 'quality_rating')))),
          timeliness_rating: Math.max(
            1,
            Math.min(5, Math.round(readNumber(reviewRow, 'timeliness_rating')))
          ),
          communication_rating: Math.max(
            1,
            Math.min(5, Math.round(readNumber(reviewRow, 'communication_rating')))
          ),
          value_rating: Math.max(1, Math.min(5, Math.round(readNumber(reviewRow, 'value_rating')))),
          cleanliness_rating: Math.max(
            1,
            Math.min(5, Math.round(readNumber(reviewRow, 'cleanliness_rating')))
          ),
          comment: readNullableString(reviewRow, 'comment'),
          photos: readStringArray(Reflect.get(reviewRow, 'photos')),
          response: readNullableString(reviewRow, 'response'),
          responded_at: readNullableString(reviewRow, 'responded_at'),
          created_at: readString(reviewRow, 'created_at'),
          helpful_up: 0,
          helpful_down: 0
        };
      });

      const ratingBreakdown = {
        average: computeAverage(reviewRows.map((reviewRow) => readNumber(reviewRow, 'rating'))),
        total_reviews: reviewRows.length,
        distribution: buildDistribution(reviewRows),
        categories: {
          quality: computeAverage(reviewRows.map((reviewRow) => readNumber(reviewRow, 'quality_rating'))),
          timeliness: computeAverage(
            reviewRows.map((reviewRow) => readNumber(reviewRow, 'timeliness_rating'))
          ),
          communication: computeAverage(
            reviewRows.map((reviewRow) => readNumber(reviewRow, 'communication_rating'))
          ),
          value: computeAverage(reviewRows.map((reviewRow) => readNumber(reviewRow, 'value_rating'))),
          cleanliness: computeAverage(
            reviewRows.map((reviewRow) => readNumber(reviewRow, 'cleanliness_rating'))
          )
        }
      };

      const certificationsRaw = workerRow ? Reflect.get(workerRow, 'certifications') : null;
      const certifications = Array.isArray(certificationsRaw)
        ? certificationsRaw
            .map((item) => parseCertification(item))
            .filter((item): item is z.infer<typeof workerCertificationSchema> => item !== null)
        : [];

      const portfolioPhotos = workerRow
        ? readStringArray(Reflect.get(workerRow, 'portfolio_photos'))
        : [];
      const portfolioItems = portfolioPhotos.map((photo, index) => ({
        id: `portfolio-${index + 1}`,
        image_url: photo,
        before_url: index % 2 === 0 ? photo : null,
        after_url: index % 2 === 1 ? photo : null,
        video_url: null,
        category: 'general',
        date: null,
        customer_rating: null
      }));

      const isOwner = ctx.profile?.id === input.user_id;
      let canContact = false;
      let activeJobId: string | null = null;

      if (ctx.profile?.role === 'customer') {
        const activeJobResult = await ctx.supabase
          .from('jobs')
          .select('id')
          .eq('customer_id', ctx.profile.id)
          .eq('assigned_worker_id', input.user_id)
          .in('status', ['assigned', 'in_progress', 'completed', 'reviewed'])
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const activeJobRow =
          activeJobResult.data &&
          typeof activeJobResult.data === 'object' &&
          !Array.isArray(activeJobResult.data)
            ? activeJobResult.data
            : null;

        activeJobId = activeJobRow ? readString(activeJobRow, 'id') : null;
        canContact = !!activeJobId;
      }

      return {
        profile: toProfileSchema(profileRow),
        worker_profile: workerRow
          ? {
              bio: readNullableString(workerRow, 'bio'),
              skills: readStringArray(Reflect.get(workerRow, 'skills')),
              certifications,
              portfolio_items: portfolioItems,
              hourly_rate_min: readNumber(workerRow, 'hourly_rate_min'),
              hourly_rate_max: readNumber(workerRow, 'hourly_rate_max'),
              average_rating: readNumber(workerRow, 'average_rating'),
              completion_rate: readNumber(workerRow, 'completion_rate'),
              total_jobs: Math.floor(readNumber(workerRow, 'total_jobs')),
              total_reviews: Math.floor(readNumber(workerRow, 'total_reviews')),
              response_time_minutes: Math.floor(readNumber(workerRow, 'response_time_minutes')),
              is_available: readBoolean(workerRow, 'is_available'),
              tier: normalizeTier(readString(workerRow, 'tier')),
              service_radius_km: readNumber(workerRow, 'service_radius_km'),
              location: readString(workerRow, 'location'),
              total_earnings: readNumber(workerRow, 'total_earnings'),
              on_time_rate: readNumber(workerRow, 'completion_rate'),
              repeat_customers: Math.floor(readNumber(workerRow, 'total_reviews') * 0.4),
              member_since: readString(profileRow, 'created_at')
            }
          : null,
        rating_breakdown: ratingBreakdown,
        reviews: mappedReviews,
        is_owner: isOwner,
        can_contact: canContact,
        active_job_id: activeJobId
      };
    }),

  updateWorkerProfile: workerProcedure
    .input(workerProfileUpdateInputSchema)
    .output(z.object({ updated: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const payload: Record<string, unknown> = {};

      if (input.bio !== undefined) {
        payload.bio = input.bio;
      }

      if (input.skills !== undefined) {
        payload.skills = input.skills;
      }

      if (input.portfolio_photos !== undefined) {
        payload.portfolio_photos = input.portfolio_photos;
      }

      if (input.hourly_rate_min !== undefined) {
        payload.hourly_rate_min = input.hourly_rate_min;
      }

      if (input.hourly_rate_max !== undefined) {
        payload.hourly_rate_max = input.hourly_rate_max;
      }

      if (input.availability_schedule !== undefined) {
        payload.availability_schedule = input.availability_schedule;
      }

      const result = await ctx.supabase
        .from('worker_profiles')
        .update(payload)
        .eq('user_id', ctx.profile.id);

      if (result.error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to update worker profile' });
      }

      return { updated: true };
    }),

  toggleAvailability: workerProcedure
    .input(toggleAvailabilityInputSchema)
    .output(z.object({ is_available: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const worker = await ctx.supabase
        .from('worker_profiles')
        .select('*')
        .eq('user_id', ctx.profile.id)
        .single();
      const workerRow =
        worker.data && typeof worker.data === 'object' && !Array.isArray(worker.data)
          ? worker.data
          : null;

      if (!workerRow) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Worker profile not found' });
      }

      const nextValue = input.is_available ?? !readBoolean(workerRow, 'is_available');
      await ctx.supabase
        .from('worker_profiles')
        .update({ is_available: nextValue })
        .eq('user_id', ctx.profile.id);

      return { is_available: nextValue };
    }),

  getDashboardStats: protectedProcedure
    .output(dashboardStatsOutputSchema)
    .query(async ({ ctx }) => {
      const role = readString(ctx.profile, 'role');

      if (role === 'customer') {
        const activeJobs = await ctx.supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', ctx.profile.id)
          .in('status', ['posted', 'bidding', 'assigned', 'in_progress']);

        const payments = await ctx.supabase
          .from('payments')
          .select('amount,platform_fee')
          .eq('customer_id', ctx.profile.id)
          .eq('status', 'captured');

        const paymentRows = rows(payments.data);
        const totalSpent = paymentRows.reduce((sum, row) => sum + readNumber(row, 'amount'), 0);
        const totalFees = paymentRows.reduce((sum, row) => sum + readNumber(row, 'platform_fee'), 0);
        const averageSavings = totalSpent > 0 ? Math.max(0, (totalFees / totalSpent) * 100) : 0;

        return {
          role: 'customer',
          active_jobs: activeJobs.count ?? 0,
          total_spent: totalSpent,
          average_savings: averageSavings
        };
      }

      if (role === 'worker') {
        const workerStats = await ctx.supabase
          .from('worker_profiles')
          .select('*')
          .eq('user_id', ctx.profile.id)
          .single();
        const workerRow =
          workerStats.data && typeof workerStats.data === 'object' && !Array.isArray(workerStats.data)
            ? workerStats.data
            : null;

        const activeBids = await ctx.supabase
          .from('bids')
          .select('id', { count: 'exact', head: true })
          .eq('worker_id', ctx.profile.id)
          .eq('status', 'pending');

        const totalEarnings = readNumber(workerRow ?? {}, 'total_earnings');
        const jobsCompleted = Math.max(0, Math.floor(readNumber(workerRow ?? {}, 'total_jobs')));
        const averageRating = Math.max(0, readNumber(workerRow ?? {}, 'average_rating'));
        const completionRate = readNumber(workerRow ?? {}, 'completion_rate');
        const tierProgress = Math.min(100, (readNumber(workerRow ?? {}, 'total_jobs') / 200) * 100);

        return {
          role: 'worker',
          total_earnings: totalEarnings,
          active_bids: activeBids.count ?? 0,
          jobs_completed: jobsCompleted,
          average_rating: averageRating,
          completion_rate: completionRate,
          tier_progress: tierProgress
        };
      }

      const activeUsers = await ctx.supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      const activeJobs = await ctx.supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .in('status', ['posted', 'bidding', 'assigned', 'in_progress']);
      const openDisputes = await ctx.supabase
        .from('disputes')
        .select('id', { count: 'exact', head: true })
        .in('status', ['open', 'under_review', 'escalated']);

      return {
        role: 'admin',
        active_users: activeUsers.count ?? 0,
        active_jobs: activeJobs.count ?? 0,
        disputes_open: openDisputes.count ?? 0
      };
    })
});
