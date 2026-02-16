'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Bell,
  BellOff,
  Camera,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Mic,
  Plus,
  SendHorizontal
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { ChatMessage } from '@/components/blocks/chat-models';

import ChatMessageBubble from '@/components/blocks/chat-message-bubble';
import {
  compressImageFile,
  fallbackConversationId,
  formatDateSeparator,
  isRecord,
  mergeChatMessages,
  readString,
  sortMessagesAscending,
  throttle,
  toMapLink,
  toRealtimeMessage
} from '@/components/blocks/chat-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { createBrowserClient } from '@/lib/supabase/client';
import { trpc } from '@/lib/trpc/client';

interface JobChatPanelProps {
  jobId: string;
  locale: 'en' | 'ar';
  fullHeight?: boolean;
}

interface BroadcastChannelRef {
  send: (payload: {
    type: 'broadcast';
    event: string;
    payload: Record<string, unknown>;
  }) => Promise<'ok' | 'error' | 'timed out'>;
}

const chatStorageBucket = process.env.NEXT_PUBLIC_CHAT_STORAGE_BUCKET ?? 'chat-media';

const fallbackText = (type: ChatMessage['type'], t: ReturnType<typeof useTranslations>): string => {
  if (type === 'image') {
    return t('panel.imageMessage');
  }

  if (type === 'voice') {
    return t('panel.voiceMessage');
  }

  if (type === 'location') {
    return t('panel.locationMessage');
  }

  return '';
};

const playMessageSound = (kind: 'message' | 'system'): void => {
  if (!navigator.userActivation.hasBeenActive) {
    return;
  }

  const context = new window.AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = kind === 'system' ? 'triangle' : 'sine';
  oscillator.frequency.value = kind === 'system' ? 760 : 620;
  gain.gain.value = 0.04;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.12);
  void context.close();
};

export const JobChatPanel = ({ jobId, locale, fullHeight = false }: JobChatPanelProps): React.JSX.Element => {
  const t = useTranslations('chatUi');
  const reducedMotion = useReducedMotion() ?? false;
  const supabase = useMemo(() => createBrowserClient(), []);
  const { user, profile } = useAuth();
  const utils = trpc.useUtils();

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const channelRef = useRef<BroadcastChannelRef | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number | null>(null);
  const lastReadRef = useRef<string | null>(null);
  const isAtBottomRef = useRef(true);

  const [messages, setMessages] = useState<ReadonlyArray<ChatMessage>>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [composer, setComposer] = useState('');
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [newMessages, setNewMessages] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);

  const conversationsQuery = trpc.chat.getConversations.useQuery(undefined, {
    refetchOnWindowFocus: true
  });

  const conversation = useMemo(
    () => (conversationsQuery.data ?? []).find((entry) => entry.job_id === jobId) ?? null,
    [conversationsQuery.data, jobId]
  );

  const messagesQuery = trpc.chat.getMessages.useQuery(
    {
      conversation_id: conversation?.id ?? fallbackConversationId,
      limit: 40
    },
    {
      enabled: !!conversation?.id
    }
  );

  const sendMutation = trpc.chat.sendMessage.useMutation();
  const markReadMutation = trpc.chat.markRead.useMutation();

  const resizeComposer = useCallback(() => {
    if (!composerRef.current) {
      return;
    }

    composerRef.current.style.height = 'auto';
    composerRef.current.style.height = `${Math.min(composerRef.current.scrollHeight, 120)}px`;
  }, []);

  const appendMessages = useCallback((nextBatch: ReadonlyArray<ChatMessage>) => {
    setMessages((previous) => mergeChatMessages(previous, nextBatch));
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    setNewMessages(0);
    setIsAtBottom(true);
  }, []);

  const uploadMediaFile = useCallback(
    async (conversationId: string, folder: string, file: File): Promise<string> => {
      const extension = file.name.includes('.') ? file.name.split('.').pop() ?? 'bin' : 'bin';
      const path = `${conversationId}/${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const upload = await supabase.storage.from(chatStorageBucket).upload(path, file, {
        upsert: false,
        contentType: file.type
      });

      if (upload.error) {
        throw new Error(upload.error.message);
      }

      return supabase.storage.from(chatStorageBucket).getPublicUrl(upload.data.path).data.publicUrl;
    },
    [supabase.storage]
  );

  const sendMessage = useCallback(
    async (payload: {
      content: string;
      type: ChatMessage['type'];
      metadata?: Record<string, unknown>;
    }): Promise<void> => {
      if (!conversation?.id || !profile?.id) {
        return;
      }

      const optimisticId = `temp-${crypto.randomUUID()}`;
      const optimistic: ChatMessage = {
        id: optimisticId,
        conversation_id: conversation.id,
        sender_id: profile.id,
        content: payload.content,
        type: payload.type,
        metadata: payload.metadata ?? null,
        read_at: null,
        created_at: new Date().toISOString(),
        pending: true
      };

      appendMessages([optimistic]);
      scrollToBottom();

      try {
        const saved = await sendMutation.mutateAsync({
          conversation_id: conversation.id,
          content: payload.content,
          type: payload.type,
          metadata: payload.metadata
        });

        const normalized = toRealtimeMessage(saved);
        if (!normalized) {
          return;
        }

        setMessages((previous) =>
          mergeChatMessages(
            previous.filter((message) => message.id !== optimisticId),
            [normalized]
          )
        );

        await Promise.all([
          utils.chat.getConversations.invalidate(),
          utils.chat.getUnreadCount.invalidate()
        ]);
      } catch (error) {
        setMessages((previous) => previous.filter((message) => message.id !== optimisticId));
        toast.error(error instanceof Error ? error.message : t('panel.sendFailed'));
      }
    },
    [
      appendMessages,
      conversation?.id,
      profile?.id,
      scrollToBottom,
      sendMutation,
      t,
      utils.chat.getConversations,
      utils.chat.getUnreadCount
    ]
  );

  const sendTyping = useMemo(
    () =>
      throttle(() => {
        if (!channelRef.current || !user?.id) {
          return;
        }

        void channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: user.id }
        });
      }, 2_000),
    [user?.id]
  );

  const loadOlder = useCallback(async (): Promise<void> => {
    if (!conversation?.id || !nextCursor || loadingOlder) {
      return;
    }

    setLoadingOlder(true);
    try {
      const page = await utils.chat.getMessages.fetch({
        conversation_id: conversation.id,
        cursor: nextCursor,
        limit: 40
      });
      appendMessages(sortMessagesAscending(page.items.map((item) => ({ ...item }))));
      setNextCursor(page.nextCursor);
    } finally {
      setLoadingOlder(false);
    }
  }, [appendMessages, conversation?.id, loadingOlder, nextCursor, utils.chat.getMessages]);

  const markRead = useCallback(
    async (upToIso: string): Promise<void> => {
      if (!conversation?.id || !profile?.id || lastReadRef.current === upToIso) {
        return;
      }

      lastReadRef.current = upToIso;
      await markReadMutation.mutateAsync({
        conversation_id: conversation.id,
        up_to: new Date(upToIso)
      });

      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'read',
          payload: { user_id: profile.id, last_read_at: upToIso }
        });
      }
    },
    [conversation?.id, markReadMutation, profile?.id]
  );

  useEffect(() => {
    isAtBottomRef.current = isAtBottom;
  }, [isAtBottom]);

  useEffect(() => {
    if (!messagesQuery.data) {
      return;
    }

    appendMessages(sortMessagesAscending(messagesQuery.data.items.map((item) => ({ ...item }))));
    setNextCursor(messagesQuery.data.nextCursor);
  }, [appendMessages, messagesQuery.data]);

  useEffect(() => {
    setMessages([]);
    setNextCursor(null);
    setNewMessages(0);
  }, [conversation?.id]);

  useEffect(() => {
    if (!conversation?.id) {
      return;
    }

    const messagesChannel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          const message = toRealtimeMessage(payload);
          if (!message) {
            return;
          }

          appendMessages([message]);

          if (message.sender_id !== profile?.id) {
            if (isAtBottomRef.current) {
              scrollToBottom();
            } else {
              setNewMessages((previous) => previous + 1);
            }

            if (!document.hasFocus() && soundEnabled) {
              playMessageSound(message.type === 'system' ? 'system' : 'message');
            }
          }
        }
      )
      .subscribe();

    const chatChannel = supabase
      .channel(`chat:${conversation.id}`)
      .on('broadcast', { event: 'typing' }, (eventPayload) => {
        if (!isRecord(eventPayload) || !isRecord(Reflect.get(eventPayload, 'payload'))) {
          return;
        }

        const payload = Reflect.get(eventPayload, 'payload');
        if (!isRecord(payload)) {
          return;
        }

        const senderId = readString(payload, 'user_id');
        if (!senderId || senderId === profile?.id) {
          return;
        }

        setIsTyping(true);
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
        }

        typingTimerRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3_000);
      })
      .on('broadcast', { event: 'read' }, (eventPayload) => {
        if (!isRecord(eventPayload) || !isRecord(Reflect.get(eventPayload, 'payload'))) {
          return;
        }

        const payload = Reflect.get(eventPayload, 'payload');
        if (!isRecord(payload)) {
          return;
        }

        const senderId = readString(payload, 'user_id');
        const lastReadAt = readString(payload, 'last_read_at');
        if (!senderId || !lastReadAt || senderId === profile?.id) {
          return;
        }

        setMessages((previous) =>
          previous.map((message) =>
            message.sender_id === profile?.id &&
            !message.pending &&
            new Date(message.created_at).getTime() <= new Date(lastReadAt).getTime()
              ? { ...message, read_at: lastReadAt }
              : message
          )
        );
      })
      .subscribe();

    channelRef.current = chatChannel;

    return () => {
      channelRef.current = null;
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      void supabase.removeChannel(messagesChannel);
      void supabase.removeChannel(chatChannel);
    };
  }, [appendMessages, conversation?.id, profile?.id, scrollToBottom, soundEnabled, supabase]);

  useEffect(() => {
    if (!conversation?.id || !profile?.id || !isAtBottom) {
      return;
    }

    const unreadIncoming = messages.filter(
      (message) => message.sender_id !== profile.id && message.read_at === null
    );
    const latestUnread = unreadIncoming[unreadIncoming.length - 1];
    if (!latestUnread) {
      return;
    }

    void markRead(latestUnread.created_at);
  }, [conversation?.id, isAtBottom, markRead, messages, profile?.id]);

  const groupedMessages = useMemo(() => {
    const groups: Array<{ key: string; label: string; items: ChatMessage[] }> = [];

    messages.forEach((message) => {
      const dayKey = new Date(message.created_at).toDateString();
      const existing = groups[groups.length - 1];
      if (existing?.key !== dayKey) {
        groups.push({
          key: dayKey,
          label: formatDateSeparator(message.created_at, locale, t('panel.today'), t('panel.yesterday')),
          items: [message]
        });
        return;
      }

      existing.items.push(message);
    });

    return groups;
  }, [locale, messages, t]);

  const onScroll = useCallback(() => {
    if (!scrollRef.current) {
      return;
    }

    const target = scrollRef.current;
    const atBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 48;
    setIsAtBottom(atBottom);
    if (atBottom) {
      setNewMessages(0);
    }

    if (target.scrollTop <= 12 && nextCursor && !loadingOlder) {
      void loadOlder();
    }
  }, [loadOlder, loadingOlder, nextCursor]);

  const sendText = useCallback(async (): Promise<void> => {
    const trimmed = composer.trim();
    if (!trimmed) {
      return;
    }

    setComposer('');
    resizeComposer();
    await sendMessage({
      content: trimmed,
      type: 'text',
      metadata: { original_language: locale }
    });
  }, [composer, locale, resizeComposer, sendMessage]);

  const handleImageUpload = useCallback(
    async (file: File): Promise<void> => {
      if (!conversation?.id) {
        return;
      }

      setUploading(true);
      try {
        const compressed = await compressImageFile(file);
        const url = await uploadMediaFile(conversation.id, 'images', compressed);
        await sendMessage({
          content: fallbackText('image', t),
          type: 'image',
          metadata: { url, original_language: locale }
        });
      } catch {
        toast.error(t('panel.imageUploadFailed'));
      } finally {
        setUploading(false);
      }
    },
    [conversation?.id, locale, sendMessage, t, uploadMediaFile]
  );

  const toggleRecording = useCallback(async (): Promise<void> => {
    if (recording) {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      voiceChunksRef.current = [];
      recordStartRef.current = Date.now();
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          voiceChunksRef.current = [...voiceChunksRef.current, event.data];
        }
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => {
          track.stop();
        });

        const startedAt = recordStartRef.current;
        const duration = startedAt ? (Date.now() - startedAt) / 1_000 : 0;
        const chunk = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
        if (chunk.size === 0 || !conversation?.id) {
          return;
        }

        setUploading(true);
        void (async () => {
          try {
            const file = new File([chunk], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
            const url = await uploadMediaFile(conversation.id, 'voice', file);
            await sendMessage({
              content: fallbackText('voice', t),
              type: 'voice',
              metadata: {
                url,
                duration_seconds: Number(duration.toFixed(1)),
                original_language: locale
              }
            });
          } catch {
            toast.error(t('panel.voiceUploadFailed'));
          } finally {
            setUploading(false);
          }
        })();
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast.error(t('panel.recordingFailed'));
    }
  }, [conversation?.id, locale, recording, sendMessage, t, uploadMediaFile]);

  if (conversationsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!conversation) {
    return <p className="text-sm text-muted-foreground">{t('panel.unavailable')}</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation.other_party.avatar_url ?? undefined} />
            <AvatarFallback>{conversation.other_party.full_name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{conversation.other_party.full_name}</p>
            <p className="text-xs text-muted-foreground">{isTyping ? t('panel.typing') : t('panel.onlineReady')}</p>
          </div>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => {
            setSoundEnabled((value) => !value);
          }}
          aria-label={soundEnabled ? t('panel.soundOn') : t('panel.soundOff')}
        >
          {soundEnabled ? <Bell className="h-4 w-4" aria-hidden /> : <BellOff className="h-4 w-4" aria-hidden />}
        </Button>
      </header>

      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className={`overflow-y-auto px-3 pb-3 pt-2 sm:px-4 ${fullHeight ? 'h-[72dvh]' : 'h-[30rem]'}`}
        >
          <div className="space-y-2">
            {loadingOlder ? (
              <div className="flex items-center justify-center gap-2 py-1 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                {t('panel.loadingOlder')}
              </div>
            ) : null}

            {groupedMessages.map((group) => (
              <section key={group.key} className="space-y-2">
                <div className="sticky top-0 z-10 flex justify-center py-1">
                  <span className="rounded-full border border-border bg-background/90 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur">
                    {group.label}
                  </span>
                </div>

                {group.items.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                  >
                    <ChatMessageBubble
                      message={message}
                      locale={locale}
                      isOwn={message.sender_id === profile?.id}
                      labels={{
                        sent: t('panel.sent'),
                        delivered: t('panel.delivered'),
                        read: t('panel.read'),
                        openInMaps: t('panel.openInMaps'),
                        imageAlt: t('panel.imageAlt'),
                        playVoice: t('panel.playVoice'),
                        pauseVoice: t('panel.pauseVoice'),
                        noLocation: t('panel.noLocation'),
                        readMore: t('panel.readMore'),
                        showLess: t('panel.showLess')
                      }}
                    />
                  </motion.div>
                ))}
              </section>
            ))}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {newMessages > 0 ? (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={scrollToBottom}
              className="absolute bottom-20 start-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground shadow"
            >
              {t('panel.newMessages', { count: newMessages })}
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      <footer className="border-t border-border bg-background px-3 py-3 sm:px-4">
        <div className="flex items-end gap-2">
          <Sheet open={attachmentsOpen} onOpenChange={setAttachmentsOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="icon" aria-label={t('panel.attach')}>
                <Plus className="h-4 w-4" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>{t('panel.attach')}</SheetTitle>
                <SheetDescription>{t('panel.attachDescription')}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={() => { cameraRef.current?.click(); }}>
                  <Camera className="me-2 h-4 w-4" aria-hidden />
                  {t('panel.camera')}
                </Button>
                <Button type="button" variant="outline" onClick={() => { galleryRef.current?.click(); }}>
                  <ImageIcon className="me-2 h-4 w-4" aria-hidden />
                  {t('panel.gallery')}
                </Button>
                <Button type="button" variant={recording ? 'destructive' : 'outline'} onClick={() => { void toggleRecording(); }}>
                  <Mic className="me-2 h-4 w-4" aria-hidden />
                  {recording ? t('panel.stopRecording') : t('panel.voice')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        void sendMessage({
                          content: fallbackText('location', t),
                          type: 'location',
                          metadata: {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            map_url: toMapLink(position.coords.latitude, position.coords.longitude),
                            original_language: locale
                          }
                        });
                        setAttachmentsOpen(false);
                      },
                      () => {
                        toast.error(t('panel.locationFailed'));
                      }
                    );
                  }}
                >
                  <MapPin className="me-2 h-4 w-4" aria-hidden />
                  {t('panel.location')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }

              void handleImageUpload(file);
              setAttachmentsOpen(false);
              event.currentTarget.value = '';
            }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }

              void handleImageUpload(file);
              setAttachmentsOpen(false);
              event.currentTarget.value = '';
            }}
          />

          <Textarea
            ref={composerRef}
            rows={1}
            value={composer}
            maxLength={4000}
            className="min-h-10 resize-none"
            placeholder={t('panel.placeholder')}
            onChange={(event) => {
              setComposer(event.target.value);
              resizeComposer();
              if (event.target.value.trim().length > 0) {
                sendTyping();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void sendText();
              }
            }}
          />

          <Button
            type="button"
            size="icon"
            disabled={composer.trim().length === 0 || sendMutation.isPending}
            onClick={() => { void sendText(); }}
            aria-label={t('panel.send')}
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <SendHorizontal className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </div>

        {uploading ? (
          <div className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            {t('panel.uploading')}
          </div>
        ) : null}
      </footer>
    </div>
  );
};

export default JobChatPanel;
