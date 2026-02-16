import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { messageTypeEnum } from './enums';
import { jobs } from './jobs';
import { profiles } from './users';

export const conversations = pgTable('conversations', {
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
  is_active: boolean('is_active').notNull().default(true),
  last_message_at: timestamp('last_message_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversation_id: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    sender_id: uuid('sender_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    type: messageTypeEnum('type').notNull().default('text'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    read_at: timestamp('read_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    messagesConversationCreatedIdx: index('messages_conversation_created_at_idx').on(
      table.conversation_id,
      table.created_at
    )
  })
);

