import { describe, expect, it } from 'vitest';

import { CreateReviewInputSchema, ReviewSchema } from '../review';

const baseReviewInput = {
  job_id: '550e8400-e29b-41d4-a716-446655440000',
  reviewee_id: '660e8400-e29b-41d4-a716-446655440000',
  rating: 5,
  communication_rating: 5,
  comment: 'Excellent work quality and communication. Highly recommended.',
  photos: ['https://example.com/review-photo.jpg']
} as const;

describe('CreateReviewInputSchema', () => {
  it('accepts valid review data', () => {
    const result = CreateReviewInputSchema.safeParse(baseReviewInput);
    expect(result.success).toBe(true);
  });

  it('rejects rating above 5', () => {
    const result = CreateReviewInputSchema.safeParse({
      ...baseReviewInput,
      rating: 6
    });
    expect(result.success).toBe(false);
  });

  it('rejects more than 5 photos', () => {
    const result = CreateReviewInputSchema.safeParse({
      ...baseReviewInput,
      photos: Array.from({ length: 6 }, (_, index) => `https://example.com/${index}.jpg`)
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid photo URL', () => {
    const result = CreateReviewInputSchema.safeParse({
      ...baseReviewInput,
      photos: ['not-a-url']
    });
    expect(result.success).toBe(false);
  });
});

describe('ReviewSchema', () => {
  it('accepts a persisted review row', () => {
    const result = ReviewSchema.safeParse({
      id: '990e8400-e29b-41d4-a716-446655440000',
      job_id: baseReviewInput.job_id,
      reviewer_id: '770e8400-e29b-41d4-a716-446655440000',
      reviewee_id: baseReviewInput.reviewee_id,
      rating: 5,
      quality_rating: 5,
      timeliness_rating: 4,
      communication_rating: 5,
      value_rating: 4,
      cleanliness_rating: 5,
      comment: 'Great work.',
      photos: [],
      response: null,
      responded_at: null,
      created_at: new Date().toISOString()
    });
    expect(result.success).toBe(true);
  });
});
