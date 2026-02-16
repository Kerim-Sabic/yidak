import { relations } from 'drizzle-orm';

import { bids } from './schema/bids';
import { disputes, jobCategories, jobs } from './schema/jobs';
import { conversations, messages } from './schema/messages';
import { notifications } from './schema/notifications';
import { payments } from './schema/payments';
import { referralCodes, referralRewards } from './schema/referrals';
import { reviews } from './schema/reviews';
import { profiles, referrals, workerProfiles } from './schema/users';

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  worker_profile: one(workerProfiles, {
    fields: [profiles.id],
    references: [workerProfiles.user_id]
  }),
  customer_jobs: many(jobs, { relationName: 'customer_jobs' }),
  assigned_jobs: many(jobs, { relationName: 'assigned_jobs' }),
  worker_bids: many(bids),
  customer_payments: many(payments, { relationName: 'customer_payments' }),
  worker_payments: many(payments, { relationName: 'worker_payments' }),
  sent_messages: many(messages),
  notifications: many(notifications),
  reviews_given: many(reviews, { relationName: 'reviews_given' }),
  reviews_received: many(reviews, { relationName: 'reviews_received' }),
  referrals_made: many(referrals, { relationName: 'referrals_made' }),
  referrals_received: many(referrals, { relationName: 'referrals_received' }),
  referral_codes: many(referralCodes),
  referral_rewards_as_referrer: many(referralRewards, {
    relationName: 'referral_rewards_as_referrer'
  }),
  referral_rewards_as_referee: many(referralRewards, {
    relationName: 'referral_rewards_as_referee'
  }),
  customer_conversations: many(conversations, { relationName: 'customer_conversations' }),
  worker_conversations: many(conversations, { relationName: 'worker_conversations' }),
  disputes_initiated: many(disputes, { relationName: 'disputes_initiated' }),
  disputes_resolved: many(disputes, { relationName: 'disputes_resolved' })
}));

export const workerProfilesRelations = relations(workerProfiles, ({ one }) => ({
  profile: one(profiles, {
    fields: [workerProfiles.user_id],
    references: [profiles.id]
  })
}));

export const jobCategoriesRelations = relations(jobCategories, ({ one, many }) => ({
  parent: one(jobCategories, {
    fields: [jobCategories.parent_id],
    references: [jobCategories.id],
    relationName: 'job_category_tree'
  }),
  children: many(jobCategories, { relationName: 'job_category_tree' }),
  jobs: many(jobs)
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  customer: one(profiles, {
    fields: [jobs.customer_id],
    references: [profiles.id],
    relationName: 'customer_jobs'
  }),
  assigned_worker: one(profiles, {
    fields: [jobs.assigned_worker_id],
    references: [profiles.id],
    relationName: 'assigned_jobs'
  }),
  category: one(jobCategories, {
    fields: [jobs.category_id],
    references: [jobCategories.id]
  }),
  bids: many(bids),
  payments: many(payments),
  conversations: many(conversations),
  reviews: many(reviews),
  disputes: many(disputes)
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  job: one(jobs, {
    fields: [bids.job_id],
    references: [jobs.id]
  }),
  worker: one(profiles, {
    fields: [bids.worker_id],
    references: [profiles.id]
  })
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  job: one(jobs, {
    fields: [payments.job_id],
    references: [jobs.id]
  }),
  customer: one(profiles, {
    fields: [payments.customer_id],
    references: [profiles.id],
    relationName: 'customer_payments'
  }),
  worker: one(profiles, {
    fields: [payments.worker_id],
    references: [profiles.id],
    relationName: 'worker_payments'
  })
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  job: one(jobs, {
    fields: [conversations.job_id],
    references: [jobs.id]
  }),
  customer: one(profiles, {
    fields: [conversations.customer_id],
    references: [profiles.id],
    relationName: 'customer_conversations'
  }),
  worker: one(profiles, {
    fields: [conversations.worker_id],
    references: [profiles.id],
    relationName: 'worker_conversations'
  }),
  messages: many(messages)
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversation_id],
    references: [conversations.id]
  }),
  sender: one(profiles, {
    fields: [messages.sender_id],
    references: [profiles.id]
  })
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  job: one(jobs, {
    fields: [reviews.job_id],
    references: [jobs.id]
  }),
  reviewer: one(profiles, {
    fields: [reviews.reviewer_id],
    references: [profiles.id],
    relationName: 'reviews_given'
  }),
  reviewee: one(profiles, {
    fields: [reviews.reviewee_id],
    references: [profiles.id],
    relationName: 'reviews_received'
  })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.user_id],
    references: [profiles.id]
  })
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(profiles, {
    fields: [referrals.referrer_id],
    references: [profiles.id],
    relationName: 'referrals_made'
  }),
  referee: one(profiles, {
    fields: [referrals.referee_id],
    references: [profiles.id],
    relationName: 'referrals_received'
  })
}));

export const referralCodesRelations = relations(referralCodes, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [referralCodes.user_id],
    references: [profiles.id]
  }),
  rewards: many(referralRewards)
}));

export const referralRewardsRelations = relations(referralRewards, ({ one }) => ({
  referrer: one(profiles, {
    fields: [referralRewards.referrer_id],
    references: [profiles.id],
    relationName: 'referral_rewards_as_referrer'
  }),
  referee: one(profiles, {
    fields: [referralRewards.referee_id],
    references: [profiles.id],
    relationName: 'referral_rewards_as_referee'
  }),
  code: one(referralCodes, {
    fields: [referralRewards.code_id],
    references: [referralCodes.id]
  })
}));

export const disputesRelations = relations(disputes, ({ one }) => ({
  job: one(jobs, {
    fields: [disputes.job_id],
    references: [jobs.id]
  }),
  initiator: one(profiles, {
    fields: [disputes.initiated_by],
    references: [profiles.id],
    relationName: 'disputes_initiated'
  }),
  resolver: one(profiles, {
    fields: [disputes.resolved_by],
    references: [profiles.id],
    relationName: 'disputes_resolved'
  })
}));
