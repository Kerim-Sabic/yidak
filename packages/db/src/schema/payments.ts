import { doublePrecision, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { currencyCodeEnum, paymentStatusEnum } from './enums';
import { jobs } from './jobs';
import { profiles } from './users';

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  job_id: uuid('job_id')
    .notNull()
    .references(() => jobs.id, { onDelete: 'cascade' }),
  customer_id: uuid('customer_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  worker_id: uuid('worker_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  amount: doublePrecision('amount').notNull(),
  currency: currencyCodeEnum('currency').notNull(),
  platform_fee: doublePrecision('platform_fee').notNull(),
  worker_payout: doublePrecision('worker_payout').notNull(),
  stripe_payment_intent_id: text('stripe_payment_intent_id'),
  stripe_checkout_session_id: text('stripe_checkout_session_id'),
  status: paymentStatusEnum('status').notNull().default('pending'),
  payment_method: text('payment_method'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  authorized_at: timestamp('authorized_at', { withTimezone: true }),
  captured_at: timestamp('captured_at', { withTimezone: true }),
  voided_at: timestamp('voided_at', { withTimezone: true }),
  refunded_at: timestamp('refunded_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});
