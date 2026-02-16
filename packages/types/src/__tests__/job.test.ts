import { describe, expect, it } from 'vitest';

import { CreateJobInputSchema, LocationSchema } from '../job';

const validInput = {
  title: 'Fix my AC unit',
  description: 'AC is not cooling properly and needs full inspection with repair support.',
  category_id: '550e8400-e29b-41d4-a716-446655440000',
  location: {
    latitude: 25.2048,
    longitude: 55.2708,
    address: 'Dubai Marina Walk, Dubai',
    city: 'Dubai',
    country: 'AE'
  },
  budget_min: 100,
  budget_max: 300,
  urgency: 'normal'
} as const;

describe('CreateJobInputSchema', () => {
  it('validates a correct job input', () => {
    const result = CreateJobInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects budget_max lower than budget_min', () => {
    const result = CreateJobInputSchema.safeParse({
      ...validInput,
      budget_min: 350,
      budget_max: 300
    });
    expect(result.success).toBe(false);
  });

  it('rejects title shorter than 5 chars', () => {
    const result = CreateJobInputSchema.safeParse({
      ...validInput,
      title: 'Fix'
    });
    expect(result.success).toBe(false);
  });

  it('rejects description shorter than 20 chars', () => {
    const result = CreateJobInputSchema.safeParse({
      ...validInput,
      description: 'Needs repair'
    });
    expect(result.success).toBe(false);
  });

  it('rejects more than 10 photos', () => {
    const result = CreateJobInputSchema.safeParse({
      ...validInput,
      photos: Array.from({ length: 11 }, (_, index) => `https://example.com/p-${index}.jpg`)
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid coordinates', () => {
    const result = LocationSchema.safeParse({
      ...validInput.location,
      latitude: 200,
      longitude: -200
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid country code', () => {
    const result = CreateJobInputSchema.safeParse({
      ...validInput,
      location: {
        ...validInput.location,
        country: 'US'
      }
    });
    expect(result.success).toBe(false);
  });
});
