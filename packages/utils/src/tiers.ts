import type { WorkerTier } from '@yidak/types';

interface WorkerStats {
  totalJobs: number;
  averageRating: number;
  completionRate: number;
  responseTimeMinutes: number;
}

interface TierBenefits {
  commissionRate: number;
  maxActiveBids: number;
  profileBadge: boolean;
  priorityListing: boolean;
}

export const calculateWorkerTier = (stats: WorkerStats): WorkerTier => {
  const { totalJobs, averageRating, completionRate } = stats;

  if (totalJobs >= 200 && averageRating >= 4.8 && completionRate >= 0.98) {
    return 'platinum';
  }

  if (totalJobs >= 50 && averageRating >= 4.5 && completionRate >= 0.95) {
    return 'gold';
  }

  if (totalJobs >= 10 && averageRating >= 4.0 && completionRate >= 0.9) {
    return 'silver';
  }

  return 'bronze';
};

export const getTierBenefits = (tier: WorkerTier): TierBenefits => {
  if (tier === 'silver') {
    return {
      commissionRate: 0.18,
      maxActiveBids: 10,
      profileBadge: true,
      priorityListing: false
    };
  }

  if (tier === 'gold') {
    return {
      commissionRate: 0.15,
      maxActiveBids: 20,
      profileBadge: true,
      priorityListing: true
    };
  }

  if (tier === 'platinum') {
    return {
      commissionRate: 0.12,
      maxActiveBids: 30,
      profileBadge: true,
      priorityListing: true
    };
  }

  return {
    commissionRate: 0.2,
    maxActiveBids: 5,
    profileBadge: false,
    priorityListing: false
  };
};

