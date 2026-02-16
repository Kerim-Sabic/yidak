import { describe, expect, it } from 'vitest';

import { CreateUserInputSchema, UserSchema, WorkerProfileSchema } from '../user';

const baseUser = {
  role: 'worker',
  full_name: 'Ahmed Ali',
  phone: '+971501234567',
  email: 'ahmed@yidak.app',
  country: 'AE',
  city: 'Dubai',
  language: 'en'
} as const;

describe('CreateUserInputSchema', () => {
  it('accepts valid user data', () => {
    const result = CreateUserInputSchema.safeParse(baseUser);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = CreateUserInputSchema.safeParse({
      ...baseUser,
      email: 'invalid-email'
    });
    expect(result.success).toBe(false);
  });

  it('rejects short full_name', () => {
    const result = CreateUserInputSchema.safeParse({
      ...baseUser,
      full_name: 'A'
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-GCC country', () => {
    const result = CreateUserInputSchema.safeParse({
      ...baseUser,
      country: 'US'
    });
    expect(result.success).toBe(false);
  });
});

describe('UserSchema', () => {
  it('accepts profile row data', () => {
    const result = UserSchema.safeParse({
      id: '660e8400-e29b-41d4-a716-446655440000',
      auth_id: '770e8400-e29b-41d4-a716-446655440000',
      role: 'worker',
      full_name: 'Ahmed Ali',
      phone: '+971501234567',
      email: 'ahmed@yidak.app',
      avatar_url: 'https://example.com/avatar.jpg',
      country: 'AE',
      city: 'Dubai',
      language: 'en',
      is_verified: true,
      is_active: true,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null
    });
    expect(result.success).toBe(true);
  });
});

describe('WorkerProfileSchema', () => {
  it('accepts worker profile payload', () => {
    const result = WorkerProfileSchema.safeParse({
      user_id: '660e8400-e29b-41d4-a716-446655440000',
      bio: 'Licensed and experienced HVAC worker.',
      skills: ['ac-hvac'],
      certifications: [{ name: 'EPA' }],
      portfolio_photos: ['https://example.com/work.jpg'],
      latitude: 25.2048,
      longitude: 55.2708,
      service_radius_km: 25,
      hourly_rate_min: 80,
      hourly_rate_max: 200,
      tier: 'gold',
      total_jobs: 120,
      total_reviews: 95,
      total_earnings: 45000,
      average_rating: 4.7,
      response_time_minutes: 8,
      completion_rate: 97,
      is_available: true,
      availability_schedule: {},
      verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    expect(result.success).toBe(true);
  });

  it('rejects completion rate above 100', () => {
    const result = WorkerProfileSchema.safeParse({
      user_id: '660e8400-e29b-41d4-a716-446655440000',
      bio: null,
      skills: [],
      certifications: [],
      portfolio_photos: [],
      latitude: 25.2048,
      longitude: 55.2708,
      service_radius_km: 10,
      hourly_rate_min: 1,
      hourly_rate_max: 2,
      tier: 'bronze',
      total_jobs: 0,
      total_reviews: 0,
      total_earnings: 0,
      average_rating: 0,
      response_time_minutes: 0,
      completion_rate: 101,
      is_available: false,
      availability_schedule: null,
      verified_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    expect(result.success).toBe(false);
  });
});
