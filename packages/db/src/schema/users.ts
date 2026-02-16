import { sql } from 'drizzle-orm';
import {
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

import { countryCodeEnum, currencyCodeEnum, referralStatusEnum, userRoleEnum, workerTierEnum } from './enums';

const geographyPoint = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'geography(Point,4326)';
  }
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  auth_id: uuid('auth_id').notNull().unique(),
  role: userRoleEnum('role').notNull().default('customer'),
  full_name: text('full_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  avatar_url: text('avatar_url'),
  stripe_customer_id: text('stripe_customer_id').unique(),
  country: countryCodeEnum('country').notNull(),
  city: text('city').notNull(),
  language: text('language').notNull().default('en'),
  is_verified: boolean('is_verified').notNull().default(false),
  is_active: boolean('is_active').notNull().default(true),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deleted_at: timestamp('deleted_at', { withTimezone: true })
});

export const workerProfiles = pgTable(
  'worker_profiles',
  {
    user_id: uuid('user_id')
      .primaryKey()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    bio: text('bio'),
    skills: text('skills').array().notNull().default(sql`'{}'::text[]`),
    certifications: jsonb('certifications').array().notNull().default(sql`'{}'::jsonb[]`),
    portfolio_photos: text('portfolio_photos').array().notNull().default(sql`'{}'::text[]`),
    location: geographyPoint('location').notNull(),
    service_radius_km: doublePrecision('service_radius_km').notNull().default(10),
    hourly_rate_min: doublePrecision('hourly_rate_min').notNull().default(0),
    hourly_rate_max: doublePrecision('hourly_rate_max').notNull().default(0),
    tier: workerTierEnum('tier').notNull().default('bronze'),
    total_jobs: integer('total_jobs').notNull().default(0),
    total_reviews: integer('total_reviews').notNull().default(0),
    total_earnings: doublePrecision('total_earnings').notNull().default(0),
    average_rating: doublePrecision('average_rating').notNull().default(0),
    response_time_minutes: integer('response_time_minutes').notNull().default(0),
    completion_rate: doublePrecision('completion_rate').notNull().default(0),
    is_available: boolean('is_available').notNull().default(true),
    availability_schedule: jsonb('availability_schedule').$type<Record<string, unknown>>(),
    stripe_connect_id: text('stripe_connect_id').unique(),
    stripe_onboarding_complete: boolean('stripe_onboarding_complete').notNull().default(false),
    verified_at: timestamp('verified_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    workerProfilesLocationIdx: index('worker_profiles_location_idx').using('gist', table.location)
  })
);

export const referrals = pgTable('referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  referrer_id: uuid('referrer_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  referee_id: uuid('referee_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  code: text('code').notNull().unique(),
  reward_amount: doublePrecision('reward_amount').notNull().default(0),
  reward_currency: currencyCodeEnum('reward_currency').notNull().default('AED'),
  status: referralStatusEnum('status').notNull().default('pending'),
  credited_at: timestamp('credited_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

