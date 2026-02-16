export const UserRole = { CUSTOMER: 'customer', WORKER: 'worker', ADMIN: 'admin' } as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const JobStatus = {
  DRAFT: 'draft',
  POSTED: 'posted',
  BIDDING: 'bidding',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REVIEWED: 'reviewed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  DISPUTED: 'disputed'
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const BidStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  EXPIRED: 'expired',
  OUTBID: 'outbid'
} as const;
export type BidStatus = (typeof BidStatus)[keyof typeof BidStatus];

export const PaymentStatus = {
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured',
  VOIDED: 'voided',
  REFUNDED: 'refunded',
  FAILED: 'failed',
  DISPUTED: 'disputed'
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const UrgencyLevel = {
  FLEXIBLE: 'flexible',
  NORMAL: 'normal',
  URGENT: 'urgent',
  EMERGENCY: 'emergency'
} as const;
export type UrgencyLevel = (typeof UrgencyLevel)[keyof typeof UrgencyLevel];

export const JobCategorySlug = {
  PLUMBING: 'plumbing',
  ELECTRICAL: 'electrical',
  AC_HVAC: 'ac-hvac',
  PAINTING: 'painting',
  CARPENTRY: 'carpentry',
  CLEANING: 'cleaning',
  PEST_CONTROL: 'pest-control',
  MOVING: 'moving',
  LOCKSMITH: 'locksmith',
  APPLIANCE_REPAIR: 'appliance-repair',
  LANDSCAPING: 'landscaping',
  TILING: 'tiling',
  GLASS_MIRRORS: 'glass-mirrors',
  WELDING: 'welding',
  MASONRY: 'masonry',
  ROOFING: 'roofing',
  FLOORING: 'flooring',
  CURTAINS_BLINDS: 'curtains-blinds',
  HANDYMAN_GENERAL: 'handyman-general',
  SMART_HOME: 'smart-home',
  WATERPROOFING: 'waterproofing',
  RENOVATION: 'renovation'
} as const;
export type JobCategorySlug = (typeof JobCategorySlug)[keyof typeof JobCategorySlug];

export const GCCCountry = {
  UAE: 'AE',
  SAUDI: 'SA',
  QATAR: 'QA',
  BAHRAIN: 'BH',
  KUWAIT: 'KW',
  OMAN: 'OM'
} as const;
export type GCCCountry = (typeof GCCCountry)[keyof typeof GCCCountry];

export const GCCCurrency = {
  AE: 'AED',
  SA: 'SAR',
  QA: 'QAR',
  BH: 'BHD',
  KW: 'KWD',
  OM: 'OMR'
} as const;
export type GCCCurrency = (typeof GCCCurrency)[keyof typeof GCCCurrency];

export const WorkerTier = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum'
} as const;
export type WorkerTier = (typeof WorkerTier)[keyof typeof WorkerTier];

export const MessageType = {
  TEXT: 'text',
  IMAGE: 'image',
  VOICE: 'voice',
  SYSTEM: 'system',
  LOCATION: 'location'
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const NotificationType = {
  BID_PLACED: 'bid_placed',
  BID_ACCEPTED: 'bid_accepted',
  MESSAGE_RECEIVED: 'message_received',
  JOB_ASSIGNED: 'job_assigned',
  JOB_COMPLETED: 'job_completed',
  PAYMENT_STATUS: 'payment_status',
  REVIEW_RECEIVED: 'review_received',
  SYSTEM_ALERT: 'system_alert',
  NEW_BID: 'new_bid',
  OUTBID: 'outbid',
  JOB_POSTED: 'job_posted',
  PAYMENT_AUTHORIZED: 'payment_authorized',
  PAYMENT_RELEASED: 'payment_released',
  AUCTION_ENDING: 'auction_ending',
  TIER_UPGRADE: 'tier_upgrade',
  REFERRAL_CREDIT: 'referral_credit'
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
