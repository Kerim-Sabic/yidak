import { describe, expect, it } from 'vitest';

import { calculateWorkerTier, getTierBenefits } from './tiers';

describe('calculateWorkerTier', () => {
  it('returns bronze below silver thresholds', () => {
    expect(
      calculateWorkerTier({
        totalJobs: 9,
        averageRating: 4.9,
        completionRate: 0.99,
        responseTimeMinutes: 2
      })
    ).toBe('bronze');
  });

  it('returns silver on boundary', () => {
    expect(
      calculateWorkerTier({
        totalJobs: 10,
        averageRating: 4.0,
        completionRate: 0.9,
        responseTimeMinutes: 10
      })
    ).toBe('silver');
  });

  it('returns gold on boundary', () => {
    expect(
      calculateWorkerTier({
        totalJobs: 50,
        averageRating: 4.5,
        completionRate: 0.95,
        responseTimeMinutes: 10
      })
    ).toBe('gold');
  });

  it('returns platinum on boundary', () => {
    expect(
      calculateWorkerTier({
        totalJobs: 200,
        averageRating: 4.8,
        completionRate: 0.98,
        responseTimeMinutes: 5
      })
    ).toBe('platinum');
  });
});

describe('getTierBenefits', () => {
  it('returns expected bronze settings', () => {
    const benefits = getTierBenefits('bronze');
    expect(benefits.commissionRate).toBe(0.2);
    expect(benefits.maxActiveBids).toBe(5);
    expect(benefits.profileBadge).toBe(false);
  });

  it('returns expected platinum settings', () => {
    const benefits = getTierBenefits('platinum');
    expect(benefits.commissionRate).toBe(0.12);
    expect(benefits.maxActiveBids).toBe(30);
    expect(benefits.priorityListing).toBe(true);
  });
});
