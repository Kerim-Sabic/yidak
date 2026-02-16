import { z } from 'zod';

import { GCCCurrency, PaymentStatus } from './enums';
import { JobIdSchema, PaymentIdSchema, UserIdSchema } from './ids';

export const StripePaymentIntentIdSchema = z.string().brand<'StripePaymentIntentId'>();
export const StripeCustomerIdSchema = z.string().brand<'StripeCustomerId'>();
export const StripeConnectAccountIdSchema = z.string().brand<'StripeConnectAccountId'>();

export type StripePaymentIntentId = z.infer<typeof StripePaymentIntentIdSchema>;
export type StripeCustomerId = z.infer<typeof StripeCustomerIdSchema>;
export type StripeConnectAccountId = z.infer<typeof StripeConnectAccountIdSchema>;

export const CreatePaymentInputSchema = z.object({
  job_id: JobIdSchema,
  customer_id: UserIdSchema,
  worker_id: UserIdSchema,
  amount: z.number().positive(),
  currency: z.nativeEnum(GCCCurrency),
  payment_method: z.string().min(2).max(100)
});

export const PaymentSchema = z.object({
  id: PaymentIdSchema,
  job_id: JobIdSchema,
  customer_id: UserIdSchema,
  worker_id: UserIdSchema,
  amount: z.number().positive(),
  currency: z.nativeEnum(GCCCurrency),
  platform_fee: z.number().nonnegative(),
  worker_payout: z.number().nonnegative(),
  stripe_payment_intent_id: StripePaymentIntentIdSchema.nullable(),
  stripe_checkout_session_id: z.string().nullable(),
  status: z.nativeEnum(PaymentStatus),
  payment_method: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  authorized_at: z.coerce.date().nullable(),
  captured_at: z.coerce.date().nullable(),
  voided_at: z.coerce.date().nullable(),
  refunded_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentInputSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
