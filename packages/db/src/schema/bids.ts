import { doublePrecision, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { bidStatusEnum, currencyCodeEnum } from './enums';
import { jobs } from './jobs';
import { profiles } from './users';

export const bids = pgTable(
  'bids',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    job_id: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    worker_id: uuid('worker_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    amount: doublePrecision('amount').notNull(),
    currency: currencyCodeEnum('currency').notNull(),
    message: text('message'),
    estimated_duration_hours: integer('estimated_duration_hours').notNull(),
    status: bidStatusEnum('status').notNull().default('pending'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    withdrawn_at: timestamp('withdrawn_at', { withTimezone: true })
  },
  (table) => ({
    bidsJobAmountIdx: index('bids_job_id_amount_idx').on(table.job_id, table.amount),
    bidsWorkerStatusIdx: index('bids_worker_id_status_idx').on(table.worker_id, table.status),
    bidsJobStatusIdx: index('bids_job_id_status_idx').on(table.job_id, table.status)
  })
);

