'use client';

import { Check, CheckCheck, ExternalLink, Pause, Play } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import type { ChatMessage } from '@/components/blocks/chat-models';

import {
  buildWaveformBars,
  formatMessageTime,
  isRecord,
  readNumber,
  readString,
  toMapLink
} from '@/components/blocks/chat-utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ChatBubbleLabels {
  sent: string;
  delivered: string;
  read: string;
  openInMaps: string;
  imageAlt: string;
  playVoice: string;
  pauseVoice: string;
  noLocation: string;
  readMore: string;
  showLess: string;
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  locale: 'en' | 'ar';
  isOwn: boolean;
  labels: ChatBubbleLabels;
}

const urlPattern = /(https?:\/\/[^\s]+)/g;

const linkify = (content: string): ReadonlyArray<React.JSX.Element> =>
  content.split(urlPattern).map((part, index) => {
    const isUrl = /^https?:\/\//.test(part);
    if (!isUrl) {
      return (
        <span key={`${part}-${index}`}>
          {part}
        </span>
      );
    }

    return (
      <a
        key={`${part}-${index}`}
        href={part}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2"
      >
        {part}
      </a>
    );
  });

const VoiceMessage = ({
  message,
  labels
}: {
  message: ChatMessage;
  labels: ChatBubbleLabels;
}): React.JSX.Element => {
  const metadata = message.metadata;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioUrl = isRecord(metadata) ? readString(metadata, 'url') : '';
  const duration = isRecord(metadata) ? readNumber(metadata, 'duration_seconds') : null;
  const bars = useMemo(() => buildWaveformBars(message.id, 22), [message.id]);

  if (!audioUrl) {
    return <p className="text-sm opacity-80">{message.content}</p>;
  }

  return (
    <div className="space-y-2">
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => {
          setIsPlaying(false);
        }}
      />
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={() => {
            if (!audioRef.current) {
              return;
            }

            if (isPlaying) {
              audioRef.current.pause();
              setIsPlaying(false);
              return;
            }

            void audioRef.current.play();
            setIsPlaying(true);
          }}
          aria-label={isPlaying ? labels.pauseVoice : labels.playVoice}
        >
          {isPlaying ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
        </Button>

        <div className="flex flex-1 items-end gap-1">
          {bars.map((height, index) => (
            <span
              key={`${message.id}-bar-${index}`}
              className="w-1 rounded-full bg-current/60"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        <span className="text-xs opacity-80">{duration ? `${duration.toFixed(1)}s` : '--'}</span>
      </div>
    </div>
  );
};

const ReadReceipt = ({
  message,
  labels
}: {
  message: ChatMessage;
  labels: ChatBubbleLabels;
}): React.JSX.Element => {
  if (message.pending) {
    return <Check className="h-3.5 w-3.5 opacity-80" aria-label={labels.sent} />;
  }

  if (message.read_at) {
    return <CheckCheck className="h-3.5 w-3.5 text-sky-500" aria-label={labels.read} />;
  }

  return <CheckCheck className="h-3.5 w-3.5 opacity-80" aria-label={labels.delivered} />;
};

export const ChatMessageBubble = ({
  message,
  locale,
  isOwn,
  labels
}: ChatMessageBubbleProps): React.JSX.Element => {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const metadata = message.metadata;
  const imageUrl = isRecord(metadata) ? readString(metadata, 'url') : '';
  const latitude = isRecord(metadata) ? readNumber(metadata, 'latitude') : null;
  const longitude = isRecord(metadata) ? readNumber(metadata, 'longitude') : null;
  const mapUrl = latitude !== null && longitude !== null ? toMapLink(latitude, longitude) : '';

  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-1">
        <div className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  const longText = message.content.length > 240;
  const textContent = expanded || !longText ? message.content : `${message.content.slice(0, 240)}...`;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
          isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        }`}
      >
        {message.type === 'image' ? (
          <div className="space-y-2">
            {imageUrl ? (
              <>
                <button
                  type="button"
                  className="overflow-hidden rounded-xl"
                  onClick={() => {
                    setIsImageOpen(true);
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={labels.imageAlt}
                    className="h-40 w-full object-cover transition hover:scale-[1.02]"
                    loading="lazy"
                  />
                </button>

                <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
                  <DialogContent className="max-w-3xl p-2">
                    <DialogTitle className="sr-only">{labels.imageAlt}</DialogTitle>
                    <img src={imageUrl} alt={labels.imageAlt} className="max-h-[80dvh] w-full rounded-xl object-contain" />
                  </DialogContent>
                </Dialog>
              </>
            ) : null}
            {message.content ? <p>{linkify(message.content)}</p> : null}
          </div>
        ) : null}

        {message.type === 'voice' ? <VoiceMessage message={message} labels={labels} /> : null}

        {message.type === 'location' ? (
          <div className="space-y-2">
            {mapUrl ? (
              <div className="space-y-2 rounded-xl border border-border/40 bg-background/20 p-2">
                <p className="text-xs opacity-80">
                  {latitude?.toFixed(5)}, {longitude?.toFixed(5)}
                </p>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs underline underline-offset-2"
                >
                  {labels.openInMaps}
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </div>
            ) : (
              <p className="text-xs opacity-80">{labels.noLocation}</p>
            )}
            {message.content ? <p>{linkify(message.content)}</p> : null}
          </div>
        ) : null}

        {message.type === 'text' ? (
          <div className="space-y-1">
            <p>{linkify(textContent)}</p>
            {longText ? (
              <button
                type="button"
                onClick={() => {
                  setExpanded((value) => !value);
                }}
                className="text-xs underline underline-offset-2 opacity-90"
              >
                {expanded ? labels.showLess : labels.readMore}
              </button>
            ) : null}
          </div>
        ) : null}

        <div className={`mt-2 inline-flex w-full items-center gap-1 text-[10px] opacity-80 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span>{formatMessageTime(message.created_at, locale)}</span>
          {isOwn ? <ReadReceipt message={message} labels={labels} /> : null}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageBubble;
