import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '../middleware';

type Row = Record<string, unknown>;
type MessageKind = 'text' | 'image' | 'voice' | 'system' | 'location';

const messageTypeSchema = z.enum(['text', 'image', 'voice', 'system', 'location']);

const getMessagesInputSchema = z.object({
  conversation_id: z.string().uuid(),
  cursor: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).default(30)
});

const sendMessageInputSchema = z
  .object({
    conversation_id: z.string().uuid(),
    content: z.string().max(4000).default(''),
    type: messageTypeSchema.default('text'),
    metadata: z.record(z.unknown()).optional()
  })
  .refine(
    (value) =>
      value.content.trim().length > 0 ||
      (value.metadata !== undefined && Object.keys(value.metadata).length > 0),
    {
      message: 'Message content or metadata is required',
      path: ['content']
    }
  );

const markReadInputSchema = z.object({
  conversation_id: z.string().uuid(),
  up_to: z.coerce.date()
});

const conversationOutputSchema = z.object({
  id: z.string().uuid(),
  job_id: z.string().uuid(),
  other_party: z.object({
    id: z.string().uuid(),
    full_name: z.string(),
    avatar_url: z.string().nullable()
  }),
  unread_count: z.number().int().nonnegative(),
  last_message_at: z.string().nullable(),
  last_message_preview: z.string().nullable()
});

const messageOutputSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  content: z.string(),
  type: messageTypeSchema,
  metadata: z.record(z.unknown()).nullable(),
  read_at: z.string().nullable(),
  created_at: z.string()
});

const paginatedMessageOutputSchema = z.object({
  items: z.array(messageOutputSchema),
  nextCursor: z.string().nullable()
});

const unreadCountOutputSchema = z.object({
  count: z.number().int().nonnegative()
});

const isRecord = (value: unknown): value is Row =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const toRows = (value: unknown): ReadonlyArray<Row> =>
  Array.isArray(value) ? value.filter((item): item is Row => isRecord(item)) : [];

const readString = (row: Row, key: string): string => {
  const value = Reflect.get(row, key);
  return typeof value === 'string' ? value : '';
};

const readNullableString = (row: Row, key: string): string | null => {
  const value = Reflect.get(row, key);
  return typeof value === 'string' ? value : null;
};

const toMessageType = (raw: string): MessageKind => {
  if (raw === 'image') {
    return 'image';
  }

  if (raw === 'voice') {
    return 'voice';
  }

  if (raw === 'location') {
    return 'location';
  }

  if (raw === 'system') {
    return 'system';
  }

  return 'text';
};

const toRecordOrNull = (value: unknown): Record<string, unknown> | null =>
  isRecord(value) ? value : null;

const isParticipant = (conversation: Row, profileId: string): boolean => {
  const customerId = readString(conversation, 'customer_id');
  const workerId = readString(conversation, 'worker_id');
  return profileId === customerId || profileId === workerId;
};

const toMessage = (row: Row): z.infer<typeof messageOutputSchema> => ({
  id: readString(row, 'id'),
  conversation_id: readString(row, 'conversation_id'),
  sender_id: readString(row, 'sender_id'),
  content: readString(row, 'content'),
  type: toMessageType(readString(row, 'type')),
  metadata: toRecordOrNull(Reflect.get(row, 'metadata')),
  read_at: readNullableString(row, 'read_at'),
  created_at: readString(row, 'created_at')
});

const previewForMessage = (message: z.infer<typeof messageOutputSchema>): string => {
  if (message.type === 'image') {
    return 'Photo';
  }

  if (message.type === 'voice') {
    return 'Voice note';
  }

  if (message.type === 'location') {
    return 'Location';
  }

  return message.content;
};

const defaultContentByType = (type: MessageKind): string => {
  if (type === 'image') {
    return 'Photo';
  }

  if (type === 'voice') {
    return 'Voice note';
  }

  if (type === 'location') {
    return 'Location';
  }

  if (type === 'system') {
    return 'System message';
  }

  return '';
};

export const chatRouter = createTRPCRouter({
  getConversations: protectedProcedure
    .output(z.array(conversationOutputSchema))
    .query(async ({ ctx }) => {
      const conversationResult = await ctx.supabase
        .from('conversations')
        .select('*')
        .or(`customer_id.eq.${ctx.profile.id},worker_id.eq.${ctx.profile.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      const conversationRows = toRows(conversationResult.data);
      if (conversationRows.length === 0) {
        return [];
      }

      const conversationIds = conversationRows.map((row) => readString(row, 'id'));
      const otherPartyIds = conversationRows.map((row) => {
        const customerId = readString(row, 'customer_id');
        const workerId = readString(row, 'worker_id');
        return customerId === ctx.profile.id ? workerId : customerId;
      });

      const [profileResult, latestMessagesResult, unreadResult] = await Promise.all([
        ctx.supabase.from('profiles').select('*').in('id', otherPartyIds),
        ctx.supabase
          .from('messages')
          .select('*')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false }),
        ctx.supabase
          .from('messages')
          .select('conversation_id')
          .in('conversation_id', conversationIds)
          .neq('sender_id', ctx.profile.id)
          .is('read_at', null)
      ]);

      const profilesById = new Map<string, Row>();
      toRows(profileResult.data).forEach((row) => {
        profilesById.set(readString(row, 'id'), row);
      });

      const latestByConversationId = new Map<string, z.infer<typeof messageOutputSchema>>();
      toRows(latestMessagesResult.data).forEach((row) => {
        const message = toMessage(row);
        if (!latestByConversationId.has(message.conversation_id)) {
          latestByConversationId.set(message.conversation_id, message);
        }
      });

      const unreadCountByConversationId = new Map<string, number>();
      toRows(unreadResult.data).forEach((row) => {
        const conversationId = readString(row, 'conversation_id');
        const currentCount = unreadCountByConversationId.get(conversationId) ?? 0;
        unreadCountByConversationId.set(conversationId, currentCount + 1);
      });

      return conversationRows.map((conversation) => {
        const customerId = readString(conversation, 'customer_id');
        const workerId = readString(conversation, 'worker_id');
        const otherPartyId = customerId === ctx.profile.id ? workerId : customerId;
        const otherProfile = profilesById.get(otherPartyId) ?? {};
        const conversationId = readString(conversation, 'id');
        const latestMessage = latestByConversationId.get(conversationId);

        return {
          id: conversationId,
          job_id: readString(conversation, 'job_id'),
          other_party: {
            id: readString(otherProfile, 'id'),
            full_name: readString(otherProfile, 'full_name'),
            avatar_url: readNullableString(otherProfile, 'avatar_url')
          },
          unread_count: unreadCountByConversationId.get(conversationId) ?? 0,
          last_message_at: readNullableString(conversation, 'last_message_at'),
          last_message_preview: latestMessage ? previewForMessage(latestMessage) : null
        };
      });
    }),

  getMessages: protectedProcedure
    .input(getMessagesInputSchema)
    .output(paginatedMessageOutputSchema)
    .query(async ({ ctx, input }) => {
      const conversationResult = await ctx.supabase
        .from('conversations')
        .select('*')
        .eq('id', input.conversation_id)
        .single();

      if (!conversationResult.data || !isParticipant(conversationResult.data, ctx.profile.id)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Conversation access denied' });
      }

      let query = ctx.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', input.conversation_id)
        .order('created_at', { ascending: false })
        .limit(input.limit + 1);

      if (input.cursor) {
        const cursorMessage = await ctx.supabase
          .from('messages')
          .select('created_at')
          .eq('id', input.cursor)
          .single();
        const cursorCreatedAt = readString(cursorMessage.data ?? {}, 'created_at');

        if (cursorCreatedAt) {
          query = query.lt('created_at', cursorCreatedAt);
        }
      }

      const messageResult = await query;
      const allRows = toRows(messageResult.data);
      const pageRows = allRows.slice(0, input.limit);
      const nextCursor =
        allRows.length > input.limit ? readString(pageRows[pageRows.length - 1] ?? {}, 'id') : null;

      await ctx.supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', input.conversation_id)
        .neq('sender_id', ctx.profile.id)
        .is('read_at', null);

      return {
        items: pageRows.map(toMessage),
        nextCursor
      };
    }),

  sendMessage: protectedProcedure
    .input(sendMessageInputSchema)
    .output(messageOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const conversationResult = await ctx.supabase
        .from('conversations')
        .select('*')
        .eq('id', input.conversation_id)
        .single();

      if (!conversationResult.data || !isParticipant(conversationResult.data, ctx.profile.id)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Conversation access denied' });
      }

      const sanitizedContent = input.content.trim();
      const content = sanitizedContent.length > 0 ? sanitizedContent : defaultContentByType(input.type);

      const insertResult = await ctx.supabase
        .from('messages')
        .insert({
          conversation_id: input.conversation_id,
          sender_id: ctx.profile.id,
          content,
          type: input.type,
          metadata: input.metadata ?? null
        })
        .select('*')
        .single();

      if (!insertResult.data) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to send message' });
      }

      const createdAt = readString(insertResult.data, 'created_at') || new Date().toISOString();
      await ctx.supabase
        .from('conversations')
        .update({ last_message_at: createdAt })
        .eq('id', input.conversation_id);

      const conversation = conversationResult.data;
      const recipientId =
        ctx.profile.id === readString(conversation, 'customer_id')
          ? readString(conversation, 'worker_id')
          : readString(conversation, 'customer_id');

      await ctx.supabase.from('notifications').insert({
        user_id: recipientId,
        type: 'message_received',
        title: 'New message',
        body: 'You have received a new message',
        data: {
          conversation_id: input.conversation_id,
          message_id: readString(insertResult.data, 'id')
        },
        is_read: false
      });

      await ctx.supabase.channel(`chat:${input.conversation_id}`).send({
        type: 'broadcast',
        event: 'message',
        payload: {
          conversation_id: input.conversation_id,
          message_id: readString(insertResult.data, 'id')
        }
      });

      return toMessage(insertResult.data);
    }),

  markRead: protectedProcedure
    .input(markReadInputSchema)
    .output(z.object({ marked: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const conversationResult = await ctx.supabase
        .from('conversations')
        .select('*')
        .eq('id', input.conversation_id)
        .single();

      if (!conversationResult.data || !isParticipant(conversationResult.data, ctx.profile.id)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Conversation access denied' });
      }

      const readIso = input.up_to.toISOString();
      await ctx.supabase
        .from('messages')
        .update({ read_at: readIso })
        .eq('conversation_id', input.conversation_id)
        .neq('sender_id', ctx.profile.id)
        .lte('created_at', readIso)
        .is('read_at', null);

      await ctx.supabase.channel(`chat:${input.conversation_id}`).send({
        type: 'broadcast',
        event: 'read',
        payload: {
          user_id: ctx.profile.id,
          last_read_at: readIso
        }
      });

      return { marked: true };
    }),

  getUnreadCount: protectedProcedure
    .output(unreadCountOutputSchema)
    .query(async ({ ctx }) => {
      const conversationsResult = await ctx.supabase
        .from('conversations')
        .select('id')
        .or(`customer_id.eq.${ctx.profile.id},worker_id.eq.${ctx.profile.id}`);

      const conversationIds = toRows(conversationsResult.data).map((row) => readString(row, 'id'));
      if (conversationIds.length === 0) {
        return { count: 0 };
      }

      const unreadResult = await ctx.supabase
        .from('messages')
        .select('id')
        .in('conversation_id', conversationIds)
        .neq('sender_id', ctx.profile.id)
        .is('read_at', null);

      return {
        count: toRows(unreadResult.data).length
      };
    })
});
