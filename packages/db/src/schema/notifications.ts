import { sql } from 'drizzle-orm';
import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { notificationTypeEnum } from './enums';
import { profiles } from './users';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>(),
    is_read: boolean('is_read').notNull().default(false),
    read_at: timestamp('read_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    notificationsUserReadCreatedIdx: index('notifications_user_read_created_at_idx').on(
      table.user_id,
      table.is_read,
      table.created_at
    ),
    notificationsRecentByUserIdx: index('notifications_user_recent_idx').on(
      table.user_id,
      sql`${table.created_at} DESC`
    )
  })
);

