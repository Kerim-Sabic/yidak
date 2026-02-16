import { TRPCError } from '@trpc/server';

import { t } from './init';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 100;
const requestLog = new Map<string, ReadonlyArray<number>>();

const now = (): number => Date.now();

type Role = 'customer' | 'worker' | 'admin';

const ensureAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (ctx.user === null || ctx.profile === null) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      profile: ctx.profile,
    },
  });
});

const ensureRole = (requiredRole: Role) =>
  t.middleware(async ({ ctx, next }) => {
    if (ctx.user === null || ctx.profile === null) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    if (ctx.profile.role !== requiredRole) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `${requiredRole} access required`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        profile: ctx.profile,
      },
    });
  });

export const isAuthenticated = ensureAuthenticated;
export const isCustomer = ensureRole('customer');
export const isWorker = ensureRole('worker');
export const isAdmin = ensureRole('admin');

const getRateLimitKey = (userId: string | null, path: string): string =>
  `${userId ?? 'anonymous'}:${path}`;

export const rateLimit = t.middleware(async ({ ctx, next, path }) => {
  const userId = ctx.user?.id ?? null;
  const key = getRateLimitKey(userId, path);
  const timestamp = now();

  const existing = requestLog.get(key) ?? [];
  const recent = existing.filter((entry) => timestamp - entry < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded',
    });
  }

  requestLog.set(key, [...recent, timestamp]);
  return next();
});

const rateLimitedProcedure = t.procedure.use(rateLimit);

export const publicProcedure = rateLimitedProcedure;
export const protectedProcedure = rateLimitedProcedure.use(isAuthenticated);
export const customerProcedure = rateLimitedProcedure.use(isCustomer);
export const workerProcedure = rateLimitedProcedure.use(isWorker);
export const adminProcedure = rateLimitedProcedure.use(isAdmin);

export const createTRPCRouter = t.router;
