import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['customer', 'worker', 'admin']);

export const jobStatusEnum = pgEnum('job_status', [
  'draft',
  'posted',
  'bidding',
  'assigned',
  'in_progress',
  'completed',
  'reviewed',
  'cancelled',
  'expired',
  'disputed'
]);

export const bidStatusEnum = pgEnum('bid_status', [
  'pending',
  'accepted',
  'rejected',
  'withdrawn',
  'expired',
  'outbid'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'authorized',
  'captured',
  'voided',
  'refunded',
  'failed',
  'disputed'
]);

export const urgencyLevelEnum = pgEnum('urgency_level', ['flexible', 'normal', 'urgent', 'emergency']);

export const workerTierEnum = pgEnum('worker_tier', ['bronze', 'silver', 'gold', 'platinum']);

export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'voice', 'system', 'location']);

export const notificationTypeEnum = pgEnum('notification_type', [
  'bid_placed',
  'bid_accepted',
  'message_received',
  'job_assigned',
  'job_completed',
  'payment_status',
  'review_received',
  'system_alert',
  'new_bid',
  'outbid',
  'job_posted',
  'payment_authorized',
  'payment_released',
  'auction_ending',
  'tier_upgrade',
  'referral_credit'
]);

export const referralStatusEnum = pgEnum('referral_status', [
  'pending',
  'qualified',
  'credited',
  'expired'
]);

export const referralRewardTypeEnum = pgEnum('referral_reward_type', [
  'cash',
  'discount',
  'credit'
]);

export const referralRewardStatusEnum = pgEnum('referral_reward_status', [
  'pending',
  'completed',
  'credited',
  'cancelled'
]);

export const disputeStatusEnum = pgEnum('dispute_status', [
  'open',
  'under_review',
  'resolved_customer',
  'resolved_worker',
  'escalated'
]);

export const preferredGenderEnum = pgEnum('preferred_gender', ['any', 'male', 'female']);

export const currencyCodeEnum = pgEnum('currency_code', ['AED', 'SAR', 'QAR', 'BHD', 'KWD', 'OMR']);

export const countryCodeEnum = pgEnum('country_code', ['AE', 'SA', 'QA', 'BH', 'KW', 'OM']);
