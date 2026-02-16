export type ChatMessageType = 'text' | 'image' | 'voice' | 'system' | 'location';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: ChatMessageType;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
  pending?: boolean;
}

export interface ChatConversation {
  id: string;
  job_id: string;
  other_party: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  unread_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;
}

