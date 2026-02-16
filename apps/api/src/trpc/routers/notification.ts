import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '../middleware';

const listInputSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).default(30)
});

const notificationOutputSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  data: z.record(z.unknown()).nullable(),
  is_read: z.boolean(),
  read_at: z.string().nullable(),
  created_at: z.string()
});

const listOutputSchema = z.object({
  items: z.array(notificationOutputSchema),
  unread_count: z.number().int().nonnegative(),
  nextCursor: z.string().nullable()
});

const markReadInputSchema = z.object({
  notification_id: z.string().uuid().optional(),
  all: z.boolean().optional()
});

const dismissInputSchema = z.object({
  notification_id: z.string().uuid()
});

const notificationTypePreferencesSchema = z.record(
  z.object({
    push: z.boolean(),
    in_app: z.boolean()
  })
);

const preferencesOutputSchema = z.object({
  types: notificationTypePreferencesSchema,
  quiet_hours: z.object({
    prayer_aware: z.boolean(),
    enabled: z.boolean(),
    start: z.string(),
    end: z.string()
  }),
  language: z.enum(['en', 'ar']),
  sound_enabled: z.boolean(),
  batch_bid_notifications: z.boolean()
});

const updatePreferencesInputSchema = z.object({
  types: notificationTypePreferencesSchema.optional(),
  quiet_hours: z
    .object({
      prayer_aware: z.boolean(),
      enabled: z.boolean(),
      start: z.string(),
      end: z.string()
    })
    .optional(),
  language: z.enum(['en', 'ar']).optional(),
  sound_enabled: z.boolean().optional(),
  batch_bid_notifications: z.boolean().optional()
});

const defaultPreferences: z.infer<typeof preferencesOutputSchema> = {
  types: {
    new_bid: { push: true, in_app: true },
    bid_accepted: { push: true, in_app: true },
    outbid: { push: true, in_app: true },
    job_posted: { push: true, in_app: true },
    message_received: { push: true, in_app: true },
    payment_authorized: { push: true, in_app: true },
    payment_released: { push: true, in_app: true },
    review_received: { push: true, in_app: true },
    tier_upgrade: { push: true, in_app: true },
    referral_credit: { push: true, in_app: true }
  },
  quiet_hours: {
    prayer_aware: true,
    enabled: false,
    start: '22:00',
    end: '07:00'
  },
  language: 'en',
  sound_enabled: true,
  batch_bid_notifications: false
};

const readString = (row: Record<string, unknown>, key: string): string => {
  const value = Reflect.get(row, key);
  return typeof value === 'string' ? value : '';
};

const readNullableString = (row: Record<string, unknown>, key: string): string | null => {
  const value = Reflect.get(row, key);
  return typeof value === 'string' ? value : null;
};

const readBoolean = (row: Record<string, unknown>, key: string): boolean => {
  const value = Reflect.get(row, key);
  return typeof value === 'boolean' ? value : false;
};

const rows = (value: unknown): ReadonlyArray<Record<string, unknown>> =>
  Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    : [];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const toRecord = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

const readProfileMetadata = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? toRecord(value) : {};

const readPreferencesFromMetadata = (
  metadata: Record<string, unknown>
): z.infer<typeof preferencesOutputSchema> => {
  const stored = Reflect.get(metadata, 'notification_preferences');
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
    return defaultPreferences;
  }

  const parsed = preferencesOutputSchema.safeParse(stored);
  if (parsed.success) {
    return parsed.data;
  }

  return defaultPreferences;
};

const mapNotification = (row: Record<string, unknown>): z.infer<typeof notificationOutputSchema> => ({
  id: readString(row, 'id'),
  type: readString(row, 'type'),
  title: readString(row, 'title'),
  body: readString(row, 'body'),
  data:
    Reflect.get(row, 'data') && typeof Reflect.get(row, 'data') === 'object'
      ? toRecord(Reflect.get(row, 'data'))
      : null,
  is_read: readBoolean(row, 'is_read'),
  read_at: readNullableString(row, 'read_at'),
  created_at: readString(row, 'created_at')
});

export const notificationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listInputSchema)
    .output(listOutputSchema)
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', ctx.profile.id)
        .order('created_at', { ascending: false })
        .limit(input.limit + 1);

      if (input.cursor) {
        const cursorNotification = await ctx.supabase
          .from('notifications')
          .select('*')
          .eq('id', input.cursor)
          .single();

        const cursorCreatedAt = readString(cursorNotification.data ?? {}, 'created_at');
        if (cursorCreatedAt) {
          query = query.lt('created_at', cursorCreatedAt);
        }
      }

      const result = await query;
      const allRows = rows(result.data);
      const pageRows = allRows.slice(0, input.limit);
      const nextCursor =
        allRows.length > input.limit ? readString(pageRows[pageRows.length - 1] ?? {}, 'id') : null;

      const unreadCount = await ctx.supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', ctx.profile.id)
        .eq('is_read', false);

      return {
        items: pageRows.map(mapNotification),
        unread_count: unreadCount.count ?? 0,
        nextCursor
      };
    }),

  markRead: protectedProcedure
    .input(markReadInputSchema)
    .output(z.object({ updated: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      if (input.all) {
        await ctx.supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('user_id', ctx.profile.id)
          .eq('is_read', false);

        return { updated: true };
      }

      if (input.notification_id) {
        await ctx.supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', input.notification_id)
          .eq('user_id', ctx.profile.id);
      }

      return { updated: true };
    }),

  dismiss: protectedProcedure
    .input(dismissInputSchema)
    .output(z.object({ dismissed: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.supabase
        .from('notifications')
        .delete()
        .eq('id', input.notification_id)
        .eq('user_id', ctx.profile.id);

      return { dismissed: true };
    }),

  getUnreadCount: protectedProcedure
    .output(z.object({ unread_count: z.number().int().nonnegative() }))
    .query(async ({ ctx }) => {
      const result = await ctx.supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', ctx.profile.id)
        .eq('is_read', false);

      return {
        unread_count: result.count ?? 0
      };
    }),

  getPreferences: protectedProcedure
    .output(preferencesOutputSchema)
    .query(async ({ ctx }) => {
      const profile = await ctx.supabase
        .from('profiles')
        .select('metadata')
        .eq('id', ctx.profile.id)
        .single();

      const profileRow =
        profile.data && typeof profile.data === 'object' && !Array.isArray(profile.data)
          ? profile.data
          : null;
      const metadata = readProfileMetadata(profileRow ? Reflect.get(profileRow, 'metadata') : null);
      return readPreferencesFromMetadata(metadata);
    }),

  updatePreferences: protectedProcedure
    .input(updatePreferencesInputSchema)
    .output(preferencesOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.supabase
        .from('profiles')
        .select('metadata')
        .eq('id', ctx.profile.id)
        .single();

      const profileRow =
        profile.data && typeof profile.data === 'object' && !Array.isArray(profile.data)
          ? profile.data
          : null;
      const metadata = readProfileMetadata(profileRow ? Reflect.get(profileRow, 'metadata') : null);
      const existing = readPreferencesFromMetadata(metadata);
      const nextPreferences = {
        ...existing,
        language: input.language ?? existing.language,
        sound_enabled: input.sound_enabled ?? existing.sound_enabled,
        batch_bid_notifications: input.batch_bid_notifications ?? existing.batch_bid_notifications,
        types: input.types ? { ...existing.types, ...input.types } : existing.types,
        quiet_hours: input.quiet_hours ?? existing.quiet_hours
      } satisfies z.infer<typeof preferencesOutputSchema>;

      await ctx.supabase
        .from('profiles')
        .update({
          metadata: {
            ...metadata,
            notification_preferences: nextPreferences
          }
        })
        .eq('id', ctx.profile.id);

      return nextPreferences;
    })
});
