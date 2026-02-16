import { z } from 'zod';

import { MessageType } from './enums';
import { ConversationIdSchema, JobIdSchema, MessageIdSchema, UserIdSchema } from './ids';

export const CreateConversationInputSchema = z.object({
  job_id: JobIdSchema,
  customer_id: UserIdSchema,
  worker_id: UserIdSchema
});

export const ConversationSchema = z.object({
  id: ConversationIdSchema,
  job_id: JobIdSchema,
  customer_id: UserIdSchema,
  worker_id: UserIdSchema,
  is_active: z.boolean(),
  last_message_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export const SendMessageInputSchema = z.object({
  conversation_id: ConversationIdSchema,
  content: z.string().min(1).max(4000),
  type: z.nativeEnum(MessageType).default('text'),
  metadata: z.record(z.unknown()).optional()
});

export const MessageSchema = z.object({
  id: MessageIdSchema,
  conversation_id: ConversationIdSchema,
  sender_id: UserIdSchema,
  content: z.string(),
  type: z.nativeEnum(MessageType),
  metadata: z.record(z.unknown()).nullable(),
  read_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type CreateConversationInput = z.infer<typeof CreateConversationInputSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;
export type Message = z.infer<typeof MessageSchema>;
