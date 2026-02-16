import { TRPCError } from '@trpc/server';
import { sql } from '@yidak/db';
import { CreateJobInputSchema, JobIdSchema } from '@yidak/types';
import { z } from 'zod';

import {
  createTRPCRouter,
  customerProcedure,
  protectedProcedure,
  publicProcedure,
  workerProcedure,
} from '../middleware';

import type { Context } from '../context';

const countrySchema = z.enum(['AE', 'SA', 'QA', 'BH', 'KW', 'OM']);
const urgencySchema = z.enum(['flexible', 'normal', 'urgent', 'emergency']);

const jobListInputSchema = z.object({
  status: z.string().optional(),
  category_id: z.string().uuid().optional(),
  city: z.string().optional(),
  country: countrySchema.optional(),
  urgency: urgencySchema.optional(),
  cursor: z.coerce.date().optional(),
  limit: z.number().int().positive().max(50).default(20),
});

const listAvailableInputSchema = z.object({
  category_id: z.string().uuid().optional(),
  distance_km: z.number().min(5).max(50).default(25),
  sort_by: z.enum(['newest', 'highest_budget', 'ending_soon']).default('newest'),
  limit: z.number().int().positive().max(50).default(20),
});

const searchInputSchema = z.object({
  query: z.string().min(2),
  limit: z.number().int().positive().max(50).default(20),
});

const publicJobOutputSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  urgency: z.string(),
  city: z.string(),
  country: z.string(),
  address: z.string(),
  area: z.string().nullable(),
  building: z.string().nullable(),
  location: z.string(),
  photos: z.array(z.string()),
  preferred_gender: z.string(),
  budget_min: z.number(),
  budget_max: z.number(),
  bid_count: z.number().int().nonnegative(),
  lowest_bid: z.number().nullable(),
  created_at: z.string(),
  expires_at: z.string().nullable(),
  time_remaining_seconds: z.number().int().nullable(),
  customer: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      avatar_url: z.string().nullable(),
    })
    .nullable(),
  category: z
    .object({
      id: z.string().uuid(),
      slug: z.string(),
      name_en: z.string(),
      name_ar: z.string(),
    })
    .nullable(),
});

const customerBidViewSchema = z.object({
  id: z.string().uuid(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  message: z.string().nullable(),
  created_at: z.string(),
  worker: z.object({
    id: z.string().uuid(),
    full_name: z.string(),
    avatar_url: z.string().nullable(),
    average_rating: z.number().nullable(),
    completion_rate: z.number().nullable(),
  }),
});

const jobByIdOutputSchema = z.object({
  job: publicJobOutputSchema,
  bids: z.array(customerBidViewSchema).optional(),
});

const listOutputSchema = z.object({
  items: z.array(publicJobOutputSchema),
  nextCursor: z.string().nullable(),
});

const availableJobOutputSchema = publicJobOutputSchema.extend({
  distance_km: z.number().nonnegative(),
  customer_rating: z.number().min(0).max(5).nullable(),
});

const createOutputSchema = z.object({
  job: publicJobOutputSchema,
  notifiedWorkers: z.number().int().nonnegative(),
});

const cancelOutputSchema = z.object({
  cancelled: z.literal(true),
  id: z.string().uuid(),
});

const completeOutputSchema = z.object({
  completed: z.literal(true),
  id: z.string().uuid(),
  paymentReleased: z.boolean(),
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

const readNullableNumber = (row: Record<string, unknown>, key: string): number | null => {
  const value = Reflect.get(row, key);
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const readStringArray = (row: Record<string, unknown>, key: string): string[] => {
  const value = Reflect.get(row, key);
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
};

const mapRows = (rows: unknown): ReadonlyArray<Record<string, unknown>> =>
  Array.isArray(rows)
    ? rows.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    : [];

const urgencyExpiryHours = (urgency: 'flexible' | 'normal' | 'urgent' | 'emergency'): number => {
  if (urgency === 'flexible') {
    return 48;
  }

  if (urgency === 'urgent') {
    return 6;
  }

  if (urgency === 'emergency') {
    return 2;
  }

  return 24;
};

const addHours = (input: Date, hours: number): Date =>
  new Date(input.getTime() + hours * 60 * 60 * 1000);

const toPointWkt = (latitude: number, longitude: number): string =>
  `SRID=4326;POINT(${longitude} ${latitude})`;

const ensureCanCancel = (jobRow: Record<string, unknown>): void => {
  const status = readString(jobRow, 'status');
  const acceptedBid = readNullableString(jobRow, 'accepted_bid_id');

  if ((status !== 'posted' && status !== 'bidding') || acceptedBid) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Job cannot be cancelled in its current state',
    });
  }
};

const createProfileFetcher = (ctx: Context) => {
  const cache = new Map<string, Record<string, unknown> | null>();

  return async (profileId: string): Promise<Record<string, unknown> | null> => {
    const cached = cache.get(profileId);
    if (cached !== undefined) {
      return cached;
    }

    const result = await ctx.supabase.from('profiles').select('*').eq('id', profileId).single();
    cache.set(profileId, result.data ?? null);
    return result.data ?? null;
  };
};

const createCategoryFetcher = (ctx: Context) => {
  const cache = new Map<string, Record<string, unknown> | null>();

  return async (categoryId: string): Promise<Record<string, unknown> | null> => {
    const cached = cache.get(categoryId);
    if (cached !== undefined) {
      return cached;
    }

    const result = await ctx.supabase
      .from('job_categories')
      .select('*')
      .eq('id', categoryId)
      .single();
    cache.set(categoryId, result.data ?? null);
    return result.data ?? null;
  };
};

const createCustomerRatingFetcher = (ctx: Context) => {
  const cache = new Map<string, number | null>();

  return async (customerId: string): Promise<number | null> => {
    const cached = cache.get(customerId);
    if (cached !== undefined) {
      return cached;
    }

    const result = await ctx.supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', customerId)
      .limit(200);

    const reviewRows = mapRows(result.data);
    if (reviewRows.length === 0) {
      cache.set(customerId, null);
      return null;
    }

    const total = reviewRows.reduce((sum, row) => sum + readNumber(row, 'rating'), 0);
    const rating = Math.max(0, Math.min(5, total / reviewRows.length));
    cache.set(customerId, rating);

    return rating;
  };
};

const mapJobRow = async (
  row: Record<string, unknown>,
  fetchProfile: (profileId: string) => Promise<Record<string, unknown> | null>,
  fetchCategory: (categoryId: string) => Promise<Record<string, unknown> | null>,
): Promise<z.infer<typeof publicJobOutputSchema>> => {
  const now = Date.now();
  const expiresAt = readNullableString(row, 'expires_at');
  const expiryDate = expiresAt ? new Date(expiresAt) : null;
  const timeRemainingSeconds = expiryDate
    ? Math.max(0, Math.floor((expiryDate.getTime() - now) / 1000))
    : null;

  const customerId = readString(row, 'customer_id');
  const categoryId = readString(row, 'category_id');
  const customer = customerId ? await fetchProfile(customerId) : null;
  const category = categoryId ? await fetchCategory(categoryId) : null;

  return {
    id: readString(row, 'id'),
    title: readString(row, 'title'),
    description: readString(row, 'description'),
    status: readString(row, 'status'),
    urgency: readString(row, 'urgency'),
    city: readString(row, 'city'),
    country: readString(row, 'country'),
    address: readString(row, 'address'),
    area: readNullableString(row, 'area'),
    building: readNullableString(row, 'building'),
    location: readString(row, 'location'),
    photos: readStringArray(row, 'photos'),
    preferred_gender: readString(row, 'preferred_gender'),
    budget_min: readNumber(row, 'budget_min'),
    budget_max: readNumber(row, 'budget_max'),
    bid_count: Math.max(0, Math.floor(readNumber(row, 'bid_count'))),
    lowest_bid: readNullableNumber(row, 'lowest_bid'),
    created_at: readString(row, 'created_at'),
    expires_at: expiresAt,
    time_remaining_seconds: timeRemainingSeconds,
    customer: customer
      ? {
          id: readString(customer, 'id'),
          name: readString(customer, 'full_name'),
          avatar_url: readNullableString(customer, 'avatar_url'),
        }
      : null,
    category: category
      ? {
          id: readString(category, 'id'),
          slug: readString(category, 'slug'),
          name_en: readString(category, 'name_en'),
          name_ar: readString(category, 'name_ar'),
        }
      : null,
  };
};

export const jobRouter = createTRPCRouter({
  create: customerProcedure
    .input(CreateJobInputSchema)
    .output(createOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const expiresAt = addHours(new Date(), urgencyExpiryHours(input.urgency));
      const customerId = ctx.profile.id;

      const { data } = await ctx.supabase
        .from('jobs')
        .insert({
          customer_id: customerId,
          title: input.title,
          description: input.description,
          category_id: input.category_id,
          location: toPointWkt(input.location.latitude, input.location.longitude),
          address: input.location.address,
          city: input.location.city,
          area: input.location.area ?? null,
          building: input.location.building ?? null,
          country: input.location.country,
          budget_min: input.budget_min,
          budget_max: input.budget_max,
          urgency: input.urgency,
          status: 'posted',
          expires_at: expiresAt.toISOString(),
          scheduled_date: input.scheduled_date ? input.scheduled_date.toISOString() : null,
          photos: input.photos,
          preferred_gender: input.preferred_gender,
          bid_count: 0,
          lowest_bid: null,
        })
        .select('*')
        .single();

      if (!data) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to create job' });
      }

      const workerCountResult = await ctx.supabase
        .from('worker_profiles')
        .select('user_id', { count: 'exact', head: true })
        .eq('is_available', true);

      const fetchProfile = createProfileFetcher(ctx);
      const fetchCategory = createCategoryFetcher(ctx);

      return {
        job: await mapJobRow(data, fetchProfile, fetchCategory),
        notifiedWorkers: workerCountResult.count ?? 0,
      };
    }),

  getById: publicProcedure
    .input(JobIdSchema)
    .output(jobByIdOutputSchema)
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.supabase.from('jobs').select('*').eq('id', input).single();

      if (!data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
      }

      const fetchProfile = createProfileFetcher(ctx);
      const fetchCategory = createCategoryFetcher(ctx);
      const job = await mapJobRow(data, fetchProfile, fetchCategory);

      const isOwner = ctx.profile?.id === readString(data, 'customer_id');
      if (!isOwner) {
        return { job };
      }

      const bidRows = await ctx.supabase
        .from('bids')
        .select('*')
        .eq('job_id', input)
        .order('amount', { ascending: true });

      const bids = await Promise.all(
        mapRows(bidRows.data).map(async (bidRow) => {
          const workerId = readString(bidRow, 'worker_id');
          const workerProfile = await fetchProfile(workerId);
          const workerStats = await ctx.supabase
            .from('worker_profiles')
            .select('*')
            .eq('user_id', workerId)
            .single();

          return {
            id: readString(bidRow, 'id'),
            amount: readNumber(bidRow, 'amount'),
            currency: readString(bidRow, 'currency'),
            status: readString(bidRow, 'status'),
            message: readNullableString(bidRow, 'message'),
            created_at: readString(bidRow, 'created_at'),
            worker: {
              id: readString(workerProfile ?? {}, 'id'),
              full_name: readString(workerProfile ?? {}, 'full_name'),
              avatar_url: readNullableString(workerProfile ?? {}, 'avatar_url'),
              average_rating: readNullableNumber(workerStats.data ?? {}, 'average_rating'),
              completion_rate: readNullableNumber(workerStats.data ?? {}, 'completion_rate'),
            },
          };
        }),
      );

      return {
        job,
        bids,
      };
    }),

  list: publicProcedure
    .input(jobListInputSchema)
    .output(listOutputSchema)
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(input.limit + 1);

      if (input.status) {
        query = query.eq('status', input.status);
      }
      if (input.category_id) {
        query = query.eq('category_id', input.category_id);
      }
      if (input.city) {
        query = query.eq('city', input.city);
      }
      if (input.country) {
        query = query.eq('country', input.country);
      }
      if (input.urgency) {
        query = query.eq('urgency', input.urgency);
      }
      if (input.cursor) {
        query = query.lt('created_at', input.cursor.toISOString());
      }

      const rows = mapRows((await query).data);
      const fetchProfile = createProfileFetcher(ctx);
      const fetchCategory = createCategoryFetcher(ctx);
      const sliced = rows.slice(0, input.limit);

      const items = await Promise.all(
        sliced.map((row) => mapJobRow(row, fetchProfile, fetchCategory)),
      );

      const last = rows.length > input.limit ? sliced[sliced.length - 1] : null;

      return {
        items,
        nextCursor: last ? readString(last, 'created_at') : null,
      };
    }),

  listByCustomer: customerProcedure
    .output(z.array(publicJobOutputSchema))
    .query(async ({ ctx }) => {
      const result = await ctx.supabase
        .from('jobs')
        .select('*')
        .eq('customer_id', ctx.profile.id)
        .order('created_at', { ascending: false });

      const fetchProfile = createProfileFetcher(ctx);
      const fetchCategory = createCategoryFetcher(ctx);

      return Promise.all(
        mapRows(result.data).map((row) => mapJobRow(row, fetchProfile, fetchCategory)),
      );
    }),

  listAvailable: workerProcedure
    .input(listAvailableInputSchema)
    .output(z.array(availableJobOutputSchema))
    .query(async ({ ctx, input }) => {
      const workerProfile = await ctx.supabase
        .from('worker_profiles')
        .select('*')
        .eq('user_id', ctx.profile.id)
        .single();

      if (!workerProfile.data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Worker profile not found' });
      }

      const workerRadius = readNumber(workerProfile.data, 'service_radius_km');
      const effectiveDistanceKm = Math.max(
        5,
        Math.min(input.distance_km, workerRadius || input.distance_km),
      );

      const orderByMap: Readonly<Record<'newest' | 'highest_budget' | 'ending_soon', string>> = {
        newest: 'j.created_at desc',
        highest_budget: 'j.budget_max desc, j.created_at desc',
        ending_soon: 'j.expires_at asc nulls last, j.created_at desc',
      };

      const rows = await sql.unsafe<Array<Record<string, unknown>>>(
        `select j.*, (st_distance(j.location, wp.location) / 1000.0)::double precision as distance_km
         from jobs j
         join worker_profiles wp on wp.user_id = $1
         join job_categories c on c.id = j.category_id
         where j.status in ('posted', 'bidding')
           and ($2::uuid is null or j.category_id = $2::uuid)
           and (
             cardinality(wp.skills) = 0
             or exists (
               select 1
               from unnest(wp.skills) as skill
               where lower(replace(skill, ' ', '-')) like ('%' || lower(c.slug) || '%')
             )
           )
           and st_dwithin(j.location, wp.location, $3 * 1000)
           and not exists (
             select 1
             from bids b
             where b.job_id = j.id
               and b.worker_id = $1
               and b.status in ('pending', 'accepted')
           )
         order by ${orderByMap[input.sort_by]}
         limit $4`,
        [ctx.profile.id, input.category_id ?? null, effectiveDistanceKm, input.limit],
      );

      const fetchProfile = createProfileFetcher(ctx);
      const fetchCategory = createCategoryFetcher(ctx);
      const fetchCustomerRating = createCustomerRatingFetcher(ctx);

      return Promise.all(
        rows.map(async (row) => {
          const mapped = await mapJobRow(row, fetchProfile, fetchCategory);
          const customerId = readString(row, 'customer_id');

          return {
            ...mapped,
            distance_km: Math.max(0, readNumber(row, 'distance_km')),
            customer_rating: customerId ? await fetchCustomerRating(customerId) : null,
          };
        }),
      );
    }),

  cancel: customerProcedure
    .input(JobIdSchema)
    .output(cancelOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const lookup = await ctx.supabase
        .from('jobs')
        .select('*')
        .eq('id', input)
        .eq('customer_id', ctx.profile.id)
        .single();

      if (!lookup.data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
      }

      ensureCanCancel(lookup.data);

      const update = await ctx.supabase
        .from('jobs')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Cancelled by customer',
        })
        .eq('id', input);

      if (update.error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to cancel job' });
      }

      await ctx.supabase
        .from('payments')
        .update({ status: 'voided', voided_at: new Date().toISOString() })
        .eq('job_id', input)
        .eq('status', 'authorized');

      return {
        cancelled: true,
        id: input,
      };
    }),

  complete: protectedProcedure
    .input(JobIdSchema)
    .output(completeOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const lookup = await ctx.supabase.from('jobs').select('*').eq('id', input).single();

      if (!lookup.data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
      }

      const customerId = readString(lookup.data, 'customer_id');
      const workerId = readNullableString(lookup.data, 'assigned_worker_id');
      const canComplete = ctx.profile.id === customerId || ctx.profile.id === workerId;

      if (!canComplete) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only job participants can complete this job',
        });
      }

      const update = await ctx.supabase
        .from('jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', input);

      if (update.error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to complete job' });
      }

      const releasePayment = ctx.profile.id === customerId;
      if (releasePayment) {
        await ctx.supabase
          .from('payments')
          .update({ status: 'captured', captured_at: new Date().toISOString() })
          .eq('job_id', input)
          .eq('status', 'authorized');
      }

      return {
        completed: true,
        id: input,
        paymentReleased: releasePayment,
      };
    }),

  search: publicProcedure
    .input(searchInputSchema)
    .output(z.array(publicJobOutputSchema.extend({ score: z.number().nonnegative() })))
    .query(async ({ ctx, input }) => {
      const term = input.query.trim();
      const result = await ctx.supabase
        .from('jobs')
        .select('*')
        .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
        .order('created_at', { ascending: false })
        .limit(input.limit);

      const fetchProfile = createProfileFetcher(ctx);
      const fetchCategory = createCategoryFetcher(ctx);

      const mapped = await Promise.all(
        mapRows(result.data).map(async (row) => {
          const base = await mapJobRow(row, fetchProfile, fetchCategory);
          const title = base.title.toLowerCase();
          const description = base.description.toLowerCase();
          const normalizedQuery = term.toLowerCase();
          const score =
            (title.includes(normalizedQuery) ? 1 : 0) +
            (description.includes(normalizedQuery) ? 0.5 : 0);

          return {
            ...base,
            score,
          };
        }),
      );

      return mapped.sort((left, right) => right.score - left.score);
    }),
});
