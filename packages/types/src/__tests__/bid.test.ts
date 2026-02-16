import { describe, expect, it } from 'vitest';

import { BidSchema, PlaceBidInputSchema } from '../bid';

const validBidInput = {
  job_id: '550e8400-e29b-41d4-a716-446655440000',
  amount: 150,
  currency: 'AED',
  estimated_duration_hours: 3,
  message: 'I can start today.'
} as const;

describe('PlaceBidInputSchema', () => {
  it('accepts a valid bid payload', () => {
    const result = PlaceBidInputSchema.safeParse(validBidInput);
    expect(result.success).toBe(true);
  });

  it('rejects non-positive amount', () => {
    const result = PlaceBidInputSchema.safeParse({
      ...validBidInput,
      amount: 0
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid currency', () => {
    const result = PlaceBidInputSchema.safeParse({
      ...validBidInput,
      currency: 'USD'
    });
    expect(result.success).toBe(false);
  });

  it('rejects duration above max range', () => {
    const result = PlaceBidInputSchema.safeParse({
      ...validBidInput,
      estimated_duration_hours: 900
    });
    expect(result.success).toBe(false);
  });

  it('rejects message over 1000 chars', () => {
    const result = PlaceBidInputSchema.safeParse({
      ...validBidInput,
      message: 'x'.repeat(1001)
    });
    expect(result.success).toBe(false);
  });
});

describe('BidSchema', () => {
  it('accepts a complete bid record', () => {
    const result = BidSchema.safeParse({
      id: '660e8400-e29b-41d4-a716-446655440000',
      job_id: validBidInput.job_id,
      worker_id: '770e8400-e29b-41d4-a716-446655440000',
      amount: 140,
      currency: 'AED',
      message: 'Available now.',
      estimated_duration_hours: 2,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      withdrawn_at: null
    });
    expect(result.success).toBe(true);
  });
});
