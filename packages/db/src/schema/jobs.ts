import { sql } from 'drizzle-orm';
import {
  AnyPgColumn,
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid
} from 'drizzle-orm/pg-core';

import {
  countryCodeEnum,
  disputeStatusEnum,
  jobStatusEnum,
  preferredGenderEnum,
  urgencyLevelEnum
} from './enums';
import { profiles } from './users';

const geographyPoint = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'geography(Point,4326)';
  }
});

export const jobCategories = pgTable('job_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name_en: text('name_en').notNull(),
  name_ar: text('name_ar').notNull(),
  icon: text('icon'),
  description_en: text('description_en'),
  description_ar: text('description_ar'),
  is_active: boolean('is_active').notNull().default(true),
  sort_order: integer('sort_order').notNull().default(0),
  parent_id: uuid('parent_id').references((): AnyPgColumn => jobCategories.id),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customer_id: uuid('customer_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    assigned_worker_id: uuid('assigned_worker_id').references(() => profiles.id, { onDelete: 'set null' }),
    accepted_bid_id: uuid('accepted_bid_id'),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category_id: uuid('category_id')
      .notNull()
      .references(() => jobCategories.id, { onDelete: 'restrict' }),
    location: geographyPoint('location').notNull(),
    address: text('address').notNull(),
    city: text('city').notNull(),
    area: text('area'),
    building: text('building'),
    country: countryCodeEnum('country').notNull(),
    budget_min: doublePrecision('budget_min').notNull(),
    budget_max: doublePrecision('budget_max').notNull(),
    urgency: urgencyLevelEnum('urgency').notNull().default('normal'),
    status: jobStatusEnum('status').notNull().default('posted'),
    bid_count: integer('bid_count').notNull().default(0),
    lowest_bid: doublePrecision('lowest_bid'),
    expires_at: timestamp('expires_at', { withTimezone: true }),
    scheduled_date: timestamp('scheduled_date', { withTimezone: true }),
    photos: text('photos').array().notNull().default(sql`'{}'::text[]`),
    preferred_gender: preferredGenderEnum('preferred_gender').notNull().default('any'),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    reviewed_at: timestamp('reviewed_at', { withTimezone: true }),
    cancelled_at: timestamp('cancelled_at', { withTimezone: true }),
    cancellation_reason: text('cancellation_reason'),
    views_count: integer('views_count').notNull().default(0),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    jobsStatusCityIdx: index('jobs_status_city_idx').on(table.status, table.city),
    jobsCustomerIdIdx: index('jobs_customer_id_idx').on(table.customer_id),
    jobsCategoryStatusIdx: index('jobs_category_status_idx').on(table.category_id, table.status),
    jobsStatusExpiresIdx: index('jobs_status_expires_at_idx').on(table.status, table.expires_at)
  })
);

export const disputes = pgTable('disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  job_id: uuid('job_id')
    .notNull()
    .references(() => jobs.id, { onDelete: 'cascade' }),
  initiated_by: uuid('initiated_by')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  description: text('description').notNull(),
  evidence_urls: text('evidence_urls').array().notNull().default(sql`'{}'::text[]`),
  status: disputeStatusEnum('status').notNull().default('open'),
  resolution_notes: text('resolution_notes'),
  resolved_by: uuid('resolved_by').references(() => profiles.id, { onDelete: 'set null' }),
  resolved_at: timestamp('resolved_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

