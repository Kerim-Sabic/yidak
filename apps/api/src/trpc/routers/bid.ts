import { TRPCError } from '@trpc/server';
import { sql } from '@yidak/db';
import { BidIdSchema, JobIdSchema } from '@yidak/types';
import { z } from 'zod';

import {
  createTRPCRouter,
  customerProcedure,
  protectedProcedure,
  workerProcedure,
} from '../middleware';

import type { Context } from '../context';

const placeBidInputSchema = z.object({
  job_id: JobIdSchema,
  amount: z.number().positive(),
  message: z.string().max(500).optional(),
  estimated_duration_hours: z.number().positive(),
});

const workerBidSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  avatar_url: z.string().nullable(),
  is_verified: z.boolean(),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  average_rating: z.number().nullable(),
  completion_rate: z.number().nullable(),
  response_time_minutes: z.number().nullable(),
  total_reviews: z.number().int().nonnegative(),
  distance_km: z.number().nonnegative().nullable(),
});

const bidOutputSchema = z.object({
  id: z.string().uuid(),
  job_id: z.string().uuid(),
  worker_id: z.string().uuid(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  message: z.string().nullable(),
  estimated_duration_hours: z.number(),
  created_at: z.string(),
  worker: workerBidSchema.nullable(),
});

const bidJobSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.string(),
  budget_min: z.number(),
  budget_max: z.number(),
  lowest_bid: z.number().nullable(),
  city: z.string(),
  country: z.string(),
  created_at: z.string(),
  expires_at: z.string().nullable(),
});

const groupedBidItemSchema = z.object({
  bid: bidOutputSchema,
  job: bidJobSummarySchema,
  position: z.number().int().positive().nullable(),
  is_outbid: z.boolean(),
});

const groupedBidsOutputSchema = z.object({
  pending: z.array(groupedBidItemSchema),
  accepted: z.array(groupedBidItemSchema),
  rejected: z.array(groupedBidItemSchema),
  withdrawn: z.array(groupedBidItemSchema),
  expired: z.array(groupedBidItemSchema),
  outbid: z.array(groupedBidItemSchema),
});

const acceptBidInputSchema = z.object({ bid_id: BidIdSchema });

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

const readBoolean = (row: Record<string, unknown>, key: string): boolean => {
  const value = Reflect.get(row, key);
  return typeof value === 'boolean' ? value : false;
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

const normalize = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

const buildJobSummary = (job: Record<string, unknown>): z.infer<typeof bidJobSummarySchema> => ({
  id: readString(job, 'id'),
  title: readString(job, 'title'),
  status: readString(job, 'status'),
  budget_min: readNumber(job, 'budget_min'),
  budget_max: readNumber(job, 'budget_max'),
  lowest_bid: readNullableNumber(job, 'lowest_bid'),
  city: readString(job, 'city'),
  country: readString(job, 'country'),
  created_at: readString(job, 'created_at'),
  expires_at: readNullableString(job, 'expires_at'),
});

const ensureJobCanReceiveBid = (jobRow: Record<string, unknown>, amount: number): void => {
  const status = readString(jobRow, 'status');
  const expiresAt = readNullableString(jobRow, 'expires_at');
  const budgetMax = readNumber(jobRow, 'budget_max');
  const lowestBid = readNullableNumber(jobRow, 'lowest_bid') ?? 0;

  if (status !== 'posted' && status !== 'bidding') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Job is not open for bids' });
  }

  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Job has expired' });
  }

  if (amount > budgetMax) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Bid amount exceeds maximum budget' });
  }

  if (lowestBid > 0 && amount >= lowestBid) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Bid must be lower than current lowest bid',
    });
  }
};

const ensureWorkerSkillMatch = async (
  ctx: Context,
  workerProfile: Record<string, unknown>,
  jobRow: Record<string, unknown>,
): Promise<void> => {
  const skills = readStringArray(workerProfile, 'skills').map(normalize);
  if (skills.length === 0) {
    return;
  }

  const categoryId = readString(jobRow, 'category_id');
  if (!categoryId) {
    return;
  }

  const category = await ctx.supabase
    .from('job_categories')
    .select('*')
    .eq('id', categoryId)
    .single();
  if (!category.data) {
    return;
  }

  const slug = normalize(readString(category.data, 'slug'));
  const nameEn = normalize(readString(category.data, 'name_en'));
  const isMatch = skills.some(
    (skill) =>
      skill === slug ||
      skill === nameEn ||
      skill.includes(slug) ||
      skill.includes(nameEn) ||
      slug.includes(skill),
  );

  if (!isMatch) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Worker does not match required skills' });
  }
};

const loadWorkerBidDetails = async (
  ctx: Context,
  workerId: string,
  cache: Map<string, z.infer<typeof workerBidSchema> | null>,
): Promise<z.infer<typeof workerBidSchema> | null> => {
  const cached = cache.get(workerId);
  if (cached !== undefined) {
    return cached;
  }

  const profile = await ctx.supabase.from('profiles').select('*').eq('id', workerId).single();
  if (!profile.data) {
    cache.set(workerId, null);
    return null;
  }

  const workerStats = await ctx.supabase
    .from('worker_profiles')
    .select('*')
    .eq('user_id', workerId)
    .single();

  const reviewCount = await ctx.supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('reviewee_id', workerId);

  const tierValue = readString(workerStats.data ?? {}, 'tier');
  const tier =
    tierValue === 'silver' || tierValue === 'gold' || tierValue === 'platinum'
      ? tierValue
      : 'bronze';

  const mapped: z.infer<typeof workerBidSchema> = {
    id: readString(profile.data, 'id'),
    full_name: readString(profile.data, 'full_name'),
    avatar_url: readNullableString(profile.data, 'avatar_url'),
    is_verified: readBoolean(profile.data, 'is_verified'),
    tier,
    average_rating: readNullableNumber(workerStats.data ?? {}, 'average_rating'),
    completion_rate: readNullableNumber(workerStats.data ?? {}, 'completion_rate'),
    response_time_minutes: readNullableNumber(workerStats.data ?? {}, 'response_time_minutes'),
    total_reviews: reviewCount.count ?? 0,
    distance_km: null,
  };

  cache.set(workerId, mapped);
  return mapped;
};

const toBidOutput = async (
  ctx: Context,
  row: Record<string, unknown>,
  cache: Map<string, z.infer<typeof workerBidSchema> | null>,
): Promise<z.infer<typeof bidOutputSchema>> => {
  const workerId = readString(row, 'worker_id');

  return {
    id: readString(row, 'id'),
    job_id: readString(row, 'job_id'),
    worker_id: workerId,
    amount: readNumber(row, 'amount'),
    currency: readString(row, 'currency'),
    status: readString(row, 'status'),
    message: readNullableString(row, 'message'),
    estimated_duration_hours: readNumber(row, 'estimated_duration_hours'),
    created_at: readString(row, 'created_at'),
    worker: await loadWorkerBidDetails(ctx, workerId, cache),
  };
};

const placeBidTransactional = async (
  jobId: string,
  workerId: string,
  amount: number,
  message: string | null,
  estimatedDurationHours: number,
): Promise<{
  bidId: string;
  customerId: string;
  timerExtended: boolean;
  newExpiresAt: string | null;
}> =>
  sql.begin(async (tx) => {
    const [jobRow] = await tx.unsafe<
      Array<{
        id: string;
        customer_id: string;
        status: string;
        expires_at: string | null;
        budget_max: number;
        lowest_bid: number | null;
        bid_count: number;
      }>
    >(
      `select id, customer_id, status, expires_at, budget_max, lowest_bid, bid_count
       from jobs
       where id = $1
       for update`,
      [jobId],
    );

    if (!jobRow) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
    }

    ensureJobCanReceiveBid(
      {
        status: jobRow.status,
        expires_at: jobRow.expires_at,
        budget_max: jobRow.budget_max,
        lowest_bid: jobRow.lowest_bid ?? 0,
      },
      amount,
    );

    const duplicate = await tx.unsafe<Array<{ id: string }>>(
      `select id
       from bids
       where job_id = $1 and worker_id = $2 and status in ('pending', 'accepted')
       limit 1`,
      [jobId, workerId],
    );

    if (duplicate.length > 0) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Worker already bid on this job' });
    }

    const [bidRow] = await tx.unsafe<Array<{ id: string }>>(
      `insert into bids (job_id, worker_id, amount, currency, message, estimated_duration_hours, status)
       values ($1, $2, $3, 'AED', $4, $5, 'pending')
       returning id`,
      [jobId, workerId, amount, message, Math.round(estimatedDurationHours)],
    );

    if (!bidRow) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to place bid' });
    }

    const nextBidCount = jobRow.bid_count + 1;
    const currentLowest = jobRow.lowest_bid;
    const nextLowest = currentLowest === null ? amount : Math.min(currentLowest, amount);
    const nextStatus = jobRow.status === 'posted' ? 'bidding' : jobRow.status;

    let nextExpiry = jobRow.expires_at;
    let timerExtended = false;

    if (jobRow.expires_at) {
      const remainingSeconds = (new Date(jobRow.expires_at).getTime() - Date.now()) / 1000;
      if (remainingSeconds > 0 && remainingSeconds < 120) {
        nextExpiry = new Date(Date.now() + 120_000).toISOString();
        timerExtended = true;
      }
    }

    await tx.unsafe(
      `update jobs
       set bid_count = $1,
           lowest_bid = $2,
           status = $3,
           expires_at = $4,
           updated_at = now()
       where id = $5`,
      [nextBidCount, nextLowest, nextStatus, nextExpiry, jobId],
    );

    return {
      bidId: bidRow.id,
      customerId: jobRow.customer_id,
      timerExtended,
      newExpiresAt: nextExpiry,
    };
  });

const getPositionForBid = async (jobId: string, bidId: string): Promise<number | null> => {
  const rows = await sql.unsafe<Array<{ id: string }>>(
    `select id
     from bids
     where job_id = $1
       and status in ('pending', 'accepted', 'outbid')
     order by amount asc, created_at asc`,
    [jobId],
  );

  const index = rows.findIndex((row) => row.id === bidId);
  if (index < 0) {
    return null;
  }

  return index + 1;
};

export const bidRouter = createTRPCRouter({
  place: workerProcedure
    .input(placeBidInputSchema)
    .output(bidOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const workerProfile = await ctx.supabase
        .from('worker_profiles')
        .select('*')
        .eq('user_id', ctx.profile.id)
        .single();

      if (!workerProfile.data || !ctx.profile.is_verified) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Verified worker profile required' });
      }

      const jobResult = await ctx.supabase.from('jobs').select('*').eq('id', input.job_id).single();
      if (!jobResult.data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
      }

      ensureJobCanReceiveBid(jobResult.data, input.amount);
      await ensureWorkerSkillMatch(ctx, workerProfile.data, jobResult.data);

      const placed = await placeBidTransactional(
        input.job_id,
        ctx.profile.id,
        input.amount,
        input.message ?? null,
        input.estimated_duration_hours,
      );

      await ctx.supabase.from('notifications').insert({
        user_id: placed.customerId,
        type: 'bid_placed',
        title: 'New bid received',
        body: `A new bid was placed on your job ${input.job_id}`,
        data: { job_id: input.job_id, bid_id: placed.bidId },
        is_read: false,
      });

      if (placed.timerExtended && placed.newExpiresAt) {
        await ctx.supabase.channel(`job-timer:${input.job_id}`).send({
          type: 'broadcast',
          event: 'timer_extended',
          payload: { new_expires_at: placed.newExpiresAt },
        });
      }

      const lookup = await ctx.supabase.from('bids').select('*').eq('id', placed.bidId).single();
      if (!lookup.data) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to load placed bid',
        });
      }

      return toBidOutput(ctx, lookup.data, new Map());
    }),

  listForJob: protectedProcedure
    .input(JobIdSchema)
    .output(z.array(bidOutputSchema))
    .query(async ({ ctx, input }) => {
      const jobResult = await ctx.supabase.from('jobs').select('*').eq('id', input).single();
      if (!jobResult.data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
      }

      const customerId = readString(jobResult.data, 'customer_id');
      const isCustomer = ctx.profile.id === customerId;

      let query = ctx.supabase
        .from('bids')
        .select('*')
        .eq('job_id', input)
        .order('amount', { ascending: true });

      if (!isCustomer) {
        query = query.eq('worker_id', ctx.profile.id);
      }

      const rows = mapRows((await query).data);
      const workerCache = new Map<string, z.infer<typeof workerBidSchema> | null>();

      return Promise.all(rows.map((row) => toBidOutput(ctx, row, workerCache)));
    }),

  accept: customerProcedure
    .input(acceptBidInputSchema)
    .output(z.object({ accepted: z.literal(true), job_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const bidResult = await ctx.supabase.from('bids').select('*').eq('id', input.bid_id).single();
      if (!bidResult.data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Bid not found' });
      }

      const jobId = readString(bidResult.data, 'job_id');
      const jobResult = await ctx.supabase.from('jobs').select('*').eq('id', jobId).single();
      if (!jobResult.data || readString(jobResult.data, 'customer_id') !== ctx.profile.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only job owner can accept bids' });
      }

      if (!['posted', 'bidding'].includes(readString(jobResult.data, 'status'))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This auction is no longer accepting bids',
        });
      }

      const workerId = readString(bidResult.data, 'worker_id');
      const amount = readNumber(bidResult.data, 'amount');

      await ctx.supabase.from('bids').update({ status: 'accepted' }).eq('id', input.bid_id);
      await ctx.supabase
        .from('bids')
        .update({ status: 'rejected' })
        .eq('job_id', jobId)
        .neq('id', input.bid_id)
        .in('status', ['pending', 'outbid']);

      await ctx.supabase
        .from('jobs')
        .update({
          status: 'assigned',
          assigned_worker_id: workerId,
          accepted_bid_id: input.bid_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      await ctx.supabase.from('payments').upsert(
        {
          job_id: jobId,
          customer_id: ctx.profile.id,
          worker_id: workerId,
          amount,
          currency: 'AED',
          platform_fee: amount * 0.18,
          worker_payout: amount * 0.82,
          stripe_payment_intent_id: null,
          stripe_checkout_session_id: null,
          status: 'pending',
          authorized_at: null,
        },
        { onConflict: 'job_id' },
      );

      const conversation = await ctx.supabase
        .from('conversations')
        .select('id')
        .eq('job_id', jobId)
        .limit(1)
        .maybeSingle();

      if (!conversation.data) {
        await ctx.supabase.from('conversations').insert({
          job_id: jobId,
          customer_id: ctx.profile.id,
          worker_id: workerId,
          is_active: true,
          last_message_at: null,
        });
      }

      await ctx.supabase.from('notifications').insert({
        user_id: workerId,
        type: 'bid_accepted',
        title: 'Your bid was accepted',
        body: `Your bid for job ${jobId} has been accepted.`,
        data: { job_id: jobId, bid_id: input.bid_id },
        is_read: false,
      });

      const losingBids = await ctx.supabase
        .from('bids')
        .select('worker_id,id')
        .eq('job_id', jobId)
        .neq('id', input.bid_id)
        .eq('status', 'rejected');

      const losingRows = mapRows(losingBids.data);
      if (losingRows.length > 0) {
        await ctx.supabase.from('notifications').insert(
          losingRows.map((row) => ({
            user_id: readString(row, 'worker_id'),
            type: 'system_alert',
            title: 'Bid not accepted',
            body: `Another worker was selected for job ${jobId}.`,
            data: { job_id: jobId, bid_id: readString(row, 'id') },
            is_read: false,
          })),
        );
      }

      await ctx.supabase
        .channel(`job-bids:${jobId}`)
        .send({
          type: 'broadcast',
          event: 'bid_accepted',
          payload: { bid_id: input.bid_id, job_id: jobId },
        });

      return {
        accepted: true,
        job_id: jobId,
      };
    }),

  withdraw: workerProcedure
    .input(BidIdSchema)
    .output(z.object({ withdrawn: z.literal(true), bid_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const lookup = await ctx.supabase
        .from('bids')
        .select('*')
        .eq('id', input)
        .eq('worker_id', ctx.profile.id)
        .single();

      if (!lookup.data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Bid not found' });
      }

      if (readString(lookup.data, 'status') !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only pending bids can be withdrawn' });
      }

      await ctx.supabase
        .from('bids')
        .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString() })
        .eq('id', input);

      return {
        withdrawn: true,
        bid_id: input,
      };
    }),

  getMyBids: workerProcedure.output(groupedBidsOutputSchema).query(async ({ ctx }) => {
    const rows = mapRows(
      (
        await ctx.supabase
          .from('bids')
          .select('*')
          .eq('worker_id', ctx.profile.id)
          .order('created_at', { ascending: false })
      ).data,
    );

    const workerCache = new Map<string, z.infer<typeof workerBidSchema> | null>();
    const jobCache = new Map<string, Record<string, unknown> | null>();

    const items = await Promise.all(
      rows.map(async (row) => {
        const jobId = readString(row, 'job_id');
        const cachedJob = jobCache.get(jobId);

        let job = cachedJob ?? null;
        if (cachedJob === undefined) {
          const lookup = await ctx.supabase.from('jobs').select('*').eq('id', jobId).single();
          job = lookup.data ?? null;
          jobCache.set(jobId, job);
        }

        if (!job) {
          throw new TRPCError({ code: 'NOT_FOUND', message: `Job ${jobId} not found for bid` });
        }

        const bid = await toBidOutput(ctx, row, workerCache);
        const position = await getPositionForBid(jobId, readString(row, 'id'));

        return {
          bid,
          job: buildJobSummary(job),
          position,
          is_outbid: position !== null && position > 1 && bid.status === 'pending',
        };
      }),
    );

    return {
      pending: items.filter((item) => item.bid.status === 'pending'),
      accepted: items.filter((item) => item.bid.status === 'accepted'),
      rejected: items.filter((item) => item.bid.status === 'rejected'),
      withdrawn: items.filter((item) => item.bid.status === 'withdrawn'),
      expired: items.filter((item) => item.bid.status === 'expired'),
      outbid: items.filter((item) => item.bid.status === 'outbid'),
    };
  }),
});
