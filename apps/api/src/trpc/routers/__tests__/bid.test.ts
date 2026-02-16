/* @vitest-environment node */

import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { bidRouter } from '../bid';

import type { Context } from '../../context';

type Row = Record<string, unknown>;

type Tables = {
  worker_profiles: Row[];
  jobs: Row[];
  job_categories: Row[];
  bids: Row[];
  notifications: Row[];
  profiles: Row[];
  reviews: Row[];
};

const state = vi.hoisted(() => ({
  duplicateBid: false,
  updatedExpiry: null as string | null,
  broadcasts: [] as Array<{ channel: string; payload: unknown }>,
  insertedBidId: '990e8400-e29b-41d4-a716-446655440000',
  tables: {
    worker_profiles: [] as Row[],
    jobs: [] as Row[],
    job_categories: [] as Row[],
    bids: [] as Row[],
    notifications: [] as Row[],
    profiles: [] as Row[],
    reviews: [] as Row[]
  } satisfies Tables
}));

vi.mock('@yidak/db', () => ({
  sql: {
    begin: async (callback: (tx: { unsafe: (query: string, params: ReadonlyArray<unknown>) => Promise<unknown[]> }) => Promise<unknown>) =>
      callback({
        unsafe: async (query: string, params: ReadonlyArray<unknown>): Promise<unknown[]> => {
          if (query.includes('for update')) {
            return [
              {
                id: state.tables.jobs[0]?.id,
                customer_id: state.tables.jobs[0]?.customer_id,
                status: state.tables.jobs[0]?.status,
                expires_at: state.tables.jobs[0]?.expires_at,
                budget_max: state.tables.jobs[0]?.budget_max,
                lowest_bid: state.tables.jobs[0]?.lowest_bid,
                bid_count: state.tables.jobs[0]?.bid_count ?? 0
              }
            ];
          }

          if (query.includes('where job_id = $1 and worker_id = $2')) {
            return state.duplicateBid ? [{ id: 'existing-bid' }] : [];
          }

          if (query.includes('insert into bids')) {
            state.tables.bids.unshift({
              id: state.insertedBidId,
              job_id: params[0],
              worker_id: params[1],
              amount: params[2],
              currency: 'AED',
              message: params[3],
              estimated_duration_hours: params[4],
              status: 'pending',
              created_at: new Date().toISOString()
            });
            return [{ id: state.insertedBidId }];
          }

          if (query.includes('update jobs')) {
            state.updatedExpiry = (params[3] as string | null) ?? null;
            state.tables.jobs[0] = {
              ...state.tables.jobs[0],
              bid_count: params[0],
              lowest_bid: params[1],
              status: params[2],
              expires_at: params[3]
            };
            return [];
          }

          return [];
        }
      })
  }
}));

const applyFilters = (rows: ReadonlyArray<Row>, filters: ReadonlyArray<{ key: string; value: unknown }>): Row[] =>
  rows.filter((row) => filters.every((filter) => Reflect.get(row, filter.key) === filter.value));

const createSupabaseMock = () => ({
  from: (table: keyof Tables) => {
    const filters: Array<{ key: string; value: unknown }> = [];

    const builder = {
      select: () => builder,
      eq: (key: string, value: unknown) => {
        filters.push({ key, value });
        return builder;
      },
      single: async () => ({ data: applyFilters(state.tables[table], filters)[0] ?? null }),
      maybeSingle: async () => ({ data: applyFilters(state.tables[table], filters)[0] ?? null }),
      insert: async (value: unknown) => {
        const rows = Array.isArray(value) ? value : [value];
        state.tables[table].push(...rows.filter((row): row is Row => !!row && typeof row === 'object'));
        return { data: rows, error: null };
      },
      then: (onFulfilled: (value: { data: Row[]; count: number }) => unknown) =>
        Promise.resolve({
          data: applyFilters(state.tables[table], filters),
          count: applyFilters(state.tables[table], filters).length
        }).then(onFulfilled)
    };

    return builder;
  },
  channel: (channelName: string) => ({
    send: async (payload: unknown) => {
      state.broadcasts.push({ channel: channelName, payload });
      return 'ok';
    }
  })
});

const createContext = (role: 'worker' | 'customer', verified = true): Context => ({
  supabase: createSupabaseMock() as unknown as Context['supabase'],
  user: {
    id: 'aa0e8400-e29b-41d4-a716-446655440000',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
  } as Context['user'],
  profile: {
    id: '660e8400-e29b-41d4-a716-446655440000',
    auth_id: 'aa0e8400-e29b-41d4-a716-446655440000',
    role,
    full_name: 'Worker One',
    phone: '+971500000000',
    email: 'worker@yidak.app',
    avatar_url: null,
    stripe_customer_id: null,
    country: 'AE',
    city: 'Dubai',
    language: 'en',
    is_verified: verified,
    is_active: true,
    metadata: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  },
  req: new Request('http://localhost/trpc')
});

beforeEach(() => {
  state.duplicateBid = false;
  state.updatedExpiry = null;
  state.broadcasts = [];
  state.tables.worker_profiles = [
    {
      user_id: '660e8400-e29b-41d4-a716-446655440000',
      skills: ['ac-hvac'],
      tier: 'gold',
      average_rating: 4.8,
      completion_rate: 97,
      response_time_minutes: 7
    }
  ];
  state.tables.jobs = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      customer_id: '770e8400-e29b-41d4-a716-446655440000',
      status: 'posted',
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
      budget_max: 300,
      lowest_bid: null,
      bid_count: 0,
      category_id: '880e8400-e29b-41d4-a716-446655440000'
    }
  ];
  state.tables.job_categories = [{ id: '880e8400-e29b-41d4-a716-446655440000', slug: 'ac-hvac', name_en: 'AC HVAC' }];
  state.tables.bids = [];
  state.tables.notifications = [];
  state.tables.profiles = [{ id: '660e8400-e29b-41d4-a716-446655440000', full_name: 'Ahmed', avatar_url: null, is_verified: true }];
  state.tables.reviews = [{ id: 'r1', reviewee_id: '660e8400-e29b-41d4-a716-446655440000' }];
});

describe('bid.place', () => {
  it('creates a bid successfully', async () => {
    const caller = bidRouter.createCaller(createContext('worker'));
    const result = await caller.place({
      job_id: '550e8400-e29b-41d4-a716-446655440000',
      amount: 150,
      estimated_duration_hours: 2
    });

    expect(result.status).toBe('pending');
    expect(result.amount).toBe(150);
  });

  it('rejects bid higher than budget_max', async () => {
    const caller = bidRouter.createCaller(createContext('worker'));
    await expect(
      caller.place({
        job_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 99999,
        estimated_duration_hours: 2
      })
    ).rejects.toThrow('maximum budget');
  });

  it('rejects bid from customer role', async () => {
    const caller = bidRouter.createCaller(createContext('customer'));
    await expect(
      caller.place({
        job_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 150,
        estimated_duration_hours: 2
      })
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it('rejects duplicate bid on same job', async () => {
    state.duplicateBid = true;
    const caller = bidRouter.createCaller(createContext('worker'));
    await expect(
      caller.place({
        job_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 150,
        estimated_duration_hours: 2
      })
    ).rejects.toThrow('already bid');
  });

  it('rejects bid on expired job', async () => {
    state.tables.jobs[0] = {
      ...state.tables.jobs[0],
      expires_at: new Date(Date.now() - 60_000).toISOString()
    };

    const caller = bidRouter.createCaller(createContext('worker'));
    await expect(
      caller.place({
        job_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 150,
        estimated_duration_hours: 2
      })
    ).rejects.toThrow('expired');
  });

  it('extends timer on anti-sniping trigger', async () => {
    state.tables.jobs[0] = {
      ...state.tables.jobs[0],
      expires_at: new Date(Date.now() + 60_000).toISOString()
    };

    const caller = bidRouter.createCaller(createContext('worker'));
    await caller.place({
      job_id: '550e8400-e29b-41d4-a716-446655440000',
      amount: 140,
      estimated_duration_hours: 2
    });

    expect(state.updatedExpiry).not.toBeNull();
    expect(state.broadcasts.some((item) => item.channel === 'job-timer:550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });
});
