import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  authorizeEscrow as authorizeStripeEscrow,
  capturePayment as captureStripePayment,
  createConnectAccount,
  createConnectOnboardingLink,
  createCustomer,
  fromSmallestUnit,
  refundPayment as refundStripePayment,
  stripe,
  toSmallestUnit,
  voidPayment as voidStripePayment,
} from '../../services/stripe';
import { createTRPCRouter, customerProcedure, protectedProcedure, workerProcedure } from '../middleware';

import type { Context } from '../context';

const currencySchema = z.enum(['AED', 'SAR', 'QAR', 'BHD', 'KWD', 'OMR']);

const authorizeInputSchema = z.object({
  job_id: z.string().uuid(),
  bid_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: currencySchema,
});

const captureInputSchema = z.object({
  job_id: z.string().uuid(),
  amount: z.number().positive().optional(),
});

const voidInputSchema = z.object({
  job_id: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

const refundInputSchema = z.object({
  job_id: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().min(3).max(500),
});

const paymentStatusSchema = z.object({
  id: z.string().uuid(),
  job_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  worker_id: z.string().uuid(),
  status: z.string(),
  amount: z.number(),
  currency: z.string(),
  platform_fee: z.number(),
  worker_payout: z.number(),
  stripe_payment_intent_id: z.string().nullable(),
  stripe_checkout_session_id: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  authorized_at: z.string().nullable(),
  captured_at: z.string().nullable(),
  voided_at: z.string().nullable(),
  refunded_at: z.string().nullable(),
  created_at: z.string(),
});

const listPaymentsOutputSchema = z.object({
  items: z.array(paymentStatusSchema),
  total: z.number().int().nonnegative(),
});

const authorizeEscrowOutputSchema = z.object({
  clientSecret: z.string().nullable(),
  paymentIntentId: z.string(),
});

const connectOnboardOutputSchema = z.object({
  accountId: z.string(),
  onboardingUrl: z.string().url(),
});

const addPaymentMethodOutputSchema = z.object({
  clientSecret: z.string().nullable(),
  setupIntentId: z.string(),
});

type PaymentStatus = z.infer<typeof paymentStatusSchema>;
type Currency = z.infer<typeof currencySchema>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mapRows = (value: unknown): ReadonlyArray<Record<string, unknown>> =>
  Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => isRecord(item))
    : [];

const readString = (row: Record<string, unknown>, key: string): string => {
  const value = Reflect.get(row, key);
  return typeof value === 'string' ? value : '';
};

const readNullableString = (row: object, key: string): string | null => {
  const value = Reflect.get(row, key);
  return typeof value === 'string' ? value : null;
};

const readNumber = (row: Record<string, unknown>, key: string): number => {
  const value = Reflect.get(row, key);
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
};

const readCurrency = (row: Record<string, unknown>, key: string): Currency => {
  const value = Reflect.get(row, key);
  const parsed = currencySchema.safeParse(value);
  return parsed.success ? parsed.data : 'AED';
};

const toRecord = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

const toPaymentStatus = (row: Record<string, unknown>): PaymentStatus => ({
  id: readString(row, 'id'),
  job_id: readString(row, 'job_id'),
  customer_id: readString(row, 'customer_id'),
  worker_id: readString(row, 'worker_id'),
  status: readString(row, 'status'),
  amount: readNumber(row, 'amount'),
  currency: readString(row, 'currency'),
  platform_fee: readNumber(row, 'platform_fee'),
  worker_payout: readNumber(row, 'worker_payout'),
  stripe_payment_intent_id: readNullableString(row, 'stripe_payment_intent_id'),
  stripe_checkout_session_id: readNullableString(row, 'stripe_checkout_session_id'),
  metadata: isRecord(Reflect.get(row, 'metadata')) ? toRecord(Reflect.get(row, 'metadata')) : null,
  authorized_at: readNullableString(row, 'authorized_at'),
  captured_at: readNullableString(row, 'captured_at'),
  voided_at: readNullableString(row, 'voided_at'),
  refunded_at: readNullableString(row, 'refunded_at'),
  created_at: readString(row, 'created_at'),
});

const readProfileString = (ctx: Context, key: string): string => {
  if (!ctx.profile || typeof ctx.profile !== 'object') {
    return '';
  }

  const value = Reflect.get(ctx.profile, key);
  return typeof value === 'string' ? value : '';
};

const readProfileNullableString = (ctx: Context, key: string): string | null => {
  if (!ctx.profile || typeof ctx.profile !== 'object') {
    return null;
  }

  const value = Reflect.get(ctx.profile, key);
  return typeof value === 'string' ? value : null;
};

const resolveBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.API_URL ?? 'http://localhost:3000';

const ensureStripeCustomer = async (ctx: Context): Promise<string> => {
  const existing = readProfileString(ctx, 'stripe_customer_id');
  if (existing) {
    return existing;
  }

  const email = readProfileNullableString(ctx, 'email');
  const customerInput = {
    name: readProfileString(ctx, 'full_name') || 'Yidak Customer',
    phone: readProfileString(ctx, 'phone') || '0000000000',
    userId: readProfileString(ctx, 'id'),
    ...(email ? { email } : {}),
  };
  const customer = await createCustomer(customerInput);

  const update = await ctx.supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', readProfileString(ctx, 'id'));

  if (update.error) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to store Stripe customer' });
  }

  return customer.id;
};

const ensureParticipant = (payment: Record<string, unknown>, profileId: string): void => {
  const isParticipant =
    readString(payment, 'customer_id') === profileId || readString(payment, 'worker_id') === profileId;

  if (!isParticipant) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Not allowed to access this payment' });
  }
};

const upsertPaymentByJob = async (
  ctx: Context,
  jobId: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const existing = await ctx.supabase.from('payments').select('*').eq('job_id', jobId).maybeSingle();

  if (existing.data) {
    const updated = await ctx.supabase
      .from('payments')
      .update(payload)
      .eq('id', readString(existing.data, 'id'))
      .select('*')
      .single();

    if (!updated.data) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to update payment' });
    }

    return updated.data;
  }

  const inserted = await ctx.supabase.from('payments').insert(payload).select('*').single();
  if (!inserted.data) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to create payment' });
  }

  return inserted.data;
};

const readPaymentForJob = async (ctx: Context, jobId: string): Promise<Record<string, unknown>> => {
  const paymentResult = await ctx.supabase.from('payments').select('*').eq('job_id', jobId).single();
  if (!paymentResult.data) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Payment not found' });
  }
  ensureParticipant(paymentResult.data, readProfileString(ctx, 'id'));
  return paymentResult.data;
};

export const paymentRouter = createTRPCRouter({
  authorizeEscrow: customerProcedure
    .input(authorizeInputSchema)
    .output(authorizeEscrowOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.supabase
        .from('jobs')
        .select('*')
        .eq('id', input.job_id)
        .eq('customer_id', readProfileString(ctx, 'id'))
        .single();

      if (!job.data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
      }

      const bid = await ctx.supabase
        .from('bids')
        .select('*')
        .eq('id', input.bid_id)
        .eq('job_id', input.job_id)
        .single();

      if (!bid.data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Bid not found' });
      }

      const workerId = readString(bid.data, 'worker_id');
      const workerProfile = await ctx.supabase
        .from('worker_profiles')
        .select('*')
        .eq('user_id', workerId)
        .maybeSingle();

      const workerConnectAccountId = workerProfile.data
        ? readNullableString(workerProfile.data, 'stripe_connect_id')
        : null;

      const stripeCustomerId = await ensureStripeCustomer(ctx);
      const amountInSmallestUnit = toSmallestUnit(input.amount, input.currency);
      const authorizeInput = {
        amount: amountInSmallestUnit,
        currency: input.currency,
        customerId: stripeCustomerId,
        jobId: input.job_id,
        description: `Yidak escrow authorization for job ${input.job_id}`,
        metadata: {
          bid_id: input.bid_id,
          customer_id: readProfileString(ctx, 'id'),
          worker_id: workerId,
        },
        ...(workerConnectAccountId ? { workerConnectAccountId } : {}),
      };
      const paymentIntent = await authorizeStripeEscrow(authorizeInput);

      const platformFee = Number((input.amount * 0.18).toFixed(3));
      const workerPayout = Number((input.amount - platformFee).toFixed(3));
      const paymentStatus = paymentIntent.status === 'requires_capture' ? 'authorized' : 'pending';

      await upsertPaymentByJob(ctx, input.job_id, {
        job_id: input.job_id,
        customer_id: readProfileString(ctx, 'id'),
        worker_id: workerId,
        amount: input.amount,
        currency: input.currency,
        platform_fee: platformFee,
        worker_payout: workerPayout,
        stripe_payment_intent_id: paymentIntent.id,
        status: paymentStatus,
        authorized_at: paymentStatus === 'authorized' ? new Date().toISOString() : null,
        metadata: {
          stripe_payment_intent_status: paymentIntent.status,
          stripe_amount: amountInSmallestUnit,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    }),

  capturePayment: protectedProcedure
    .input(captureInputSchema)
    .output(paymentStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const payment = await readPaymentForJob(ctx, input.job_id);
      const paymentIntentId = readNullableString(payment, 'stripe_payment_intent_id');

      if (!paymentIntentId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Missing Stripe payment intent id' });
      }

      const currency = readCurrency(payment, 'currency');
      const amountToCapture = input.amount
        ? toSmallestUnit(input.amount, currency)
        : undefined;

      const captured = await captureStripePayment(paymentIntentId, amountToCapture);
      const capturedMajor = fromSmallestUnit(captured.amount_received || captured.amount, currency);
      const platformFee = Number((capturedMajor * 0.18).toFixed(3));
      const workerPayout = Number((capturedMajor - platformFee).toFixed(3));

      const updated = await ctx.supabase
        .from('payments')
        .update({
          status: 'captured',
          amount: capturedMajor,
          platform_fee: platformFee,
          worker_payout: workerPayout,
          captured_at: new Date().toISOString(),
          metadata: {
            ...toRecord(Reflect.get(payment, 'metadata')),
            stripe_capture_status: captured.status,
          },
        })
        .eq('id', readString(payment, 'id'))
        .select('*')
        .single();

      if (!updated.data) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to capture payment' });
      }

      return toPaymentStatus(updated.data);
    }),

  voidPayment: protectedProcedure
    .input(voidInputSchema)
    .output(paymentStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const payment = await readPaymentForJob(ctx, input.job_id);
      const paymentIntentId = readNullableString(payment, 'stripe_payment_intent_id');

      if (!paymentIntentId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Missing Stripe payment intent id' });
      }

      const canceled = await voidStripePayment(paymentIntentId);
      const updated = await ctx.supabase
        .from('payments')
        .update({
          status: 'voided',
          voided_at: new Date().toISOString(),
          metadata: {
            ...toRecord(Reflect.get(payment, 'metadata')),
            stripe_void_status: canceled.status,
            reason: input.reason ?? null,
          },
        })
        .eq('id', readString(payment, 'id'))
        .select('*')
        .single();

      if (!updated.data) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to void payment' });
      }

      return toPaymentStatus(updated.data);
    }),

  refundPayment: protectedProcedure
    .input(refundInputSchema)
    .output(paymentStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const payment = await readPaymentForJob(ctx, input.job_id);
      const paymentIntentId = readNullableString(payment, 'stripe_payment_intent_id');

      if (!paymentIntentId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Missing Stripe payment intent id' });
      }

      const currency = readCurrency(payment, 'currency');
      const refundAmount = toSmallestUnit(input.amount, currency);
      const refunded = await refundStripePayment(paymentIntentId, refundAmount, input.reason);
      void refunded;

      const updated = await ctx.supabase
        .from('payments')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          metadata: {
            ...toRecord(Reflect.get(payment, 'metadata')),
            refund_reason: input.reason,
          },
        })
        .eq('id', readString(payment, 'id'))
        .select('*')
        .single();

      if (!updated.data) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to refund payment' });
      }

      return toPaymentStatus(updated.data);
    }),

  getPaymentStatus: protectedProcedure
    .input(z.object({ job_id: z.string().uuid() }))
    .output(paymentStatusSchema)
    .query(async ({ ctx, input }) => {
      const payment = await readPaymentForJob(ctx, input.job_id);
      return toPaymentStatus(payment);
    }),

  listPayments: protectedProcedure
    .output(listPaymentsOutputSchema)
    .query(async ({ ctx }) => {
      const rows = mapRows(
        (
          await ctx.supabase
            .from('payments')
            .select('*')
            .or(`customer_id.eq.${readProfileString(ctx, 'id')},worker_id.eq.${readProfileString(ctx, 'id')}`)
            .order('created_at', { ascending: false })
        ).data,
      );

      return {
        items: rows.map(toPaymentStatus),
        total: rows.length,
      };
    }),

  connectOnboard: workerProcedure
    .output(connectOnboardOutputSchema)
    .mutation(async ({ ctx }) => {
      const workerProfile = await ctx.supabase
        .from('worker_profiles')
        .select('*')
        .eq('user_id', readProfileString(ctx, 'id'))
        .maybeSingle();

      if (!workerProfile.data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Worker profile not found' });
      }

      let accountId = readNullableString(workerProfile.data, 'stripe_connect_id');

      if (!accountId) {
        const account = await createConnectAccount({
          email: readProfileNullableString(ctx, 'email') ?? `worker-${readProfileString(ctx, 'id')}@yidak.app`,
          country: readProfileString(ctx, 'country'),
          userId: readProfileString(ctx, 'id'),
        });
        accountId = account.id;

        const update = await ctx.supabase
          .from('worker_profiles')
          .update({ stripe_connect_id: account.id })
          .eq('user_id', readProfileString(ctx, 'id'));

        if (update.error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unable to save Stripe Connect account',
          });
        }
      }

      if (!accountId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Stripe Connect account is unavailable',
        });
      }

      const baseUrl = resolveBaseUrl();
      const onboardingUrl = await createConnectOnboardingLink(
        accountId,
        `${baseUrl}/worker/earnings?connect=success`,
        `${baseUrl}/worker/earnings?connect=retry`,
      );

      return { accountId, onboardingUrl };
    }),

  addPaymentMethod: customerProcedure
    .output(addPaymentMethodOutputSchema)
    .mutation(async ({ ctx }) => {
      const customerId = await ensureStripeCustomer(ctx);
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        automatic_payment_methods: { enabled: true },
        usage: 'off_session',
        metadata: {
          profile_id: readProfileString(ctx, 'id'),
        },
      });

      return {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
      };
    }),
});
