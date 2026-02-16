import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { jobs } from './jobs';
import { profiles } from './users';

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    job_id: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    reviewer_id: uuid('reviewer_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    reviewee_id: uuid('reviewee_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    quality_rating: integer('quality_rating').notNull(),
    timeliness_rating: integer('timeliness_rating').notNull(),
    communication_rating: integer('communication_rating').notNull(),
    value_rating: integer('value_rating').notNull(),
    cleanliness_rating: integer('cleanliness_rating').notNull(),
    comment: text('comment'),
    photos: text('photos').array().notNull().default([]),
    response: text('response'),
    responded_at: timestamp('responded_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    reviewsRevieweeRatingIdx: index('reviews_reviewee_rating_idx').on(table.reviewee_id, table.rating)
  })
);

