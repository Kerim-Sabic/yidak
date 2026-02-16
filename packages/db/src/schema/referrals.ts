import { sql } from 'drizzle-orm';
import { doublePrecision, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { referralRewardStatusEnum, referralRewardTypeEnum } from './enums';
import { profiles } from './users';

export const referralCodes = pgTable(
  'referral_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    code: text('code').notNull().unique(),
    uses_count: integer('uses_count').notNull().default(0),
    max_uses: integer('max_uses').notNull().default(200),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    referralCodesUserCreatedIdx: index('referral_codes_user_created_idx').on(
      table.user_id,
      sql`${table.created_at} DESC`
    )
  })
);

export const referralRewards = pgTable(
  'referral_rewards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    referrer_id: uuid('referrer_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    referee_id: uuid('referee_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    code_id: uuid('code_id')
      .notNull()
      .references(() => referralCodes.id, { onDelete: 'cascade' }),
    reward_type: referralRewardTypeEnum('reward_type').notNull().default('cash'),
    reward_amount: doublePrecision('reward_amount').notNull().default(0),
    status: referralRewardStatusEnum('status').notNull().default('pending'),
    credited_at: timestamp('credited_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    referralRewardsReferrerStatusIdx: index('referral_rewards_referrer_status_idx').on(
      table.referrer_id,
      table.status,
      sql`${table.created_at} DESC`
    ),
    referralRewardsRefereeCreatedIdx: index('referral_rewards_referee_created_idx').on(
      table.referee_id,
      sql`${table.created_at} DESC`
    ),
    referralRewardsCodeIdx: index('referral_rewards_code_idx').on(table.code_id)
  })
);

