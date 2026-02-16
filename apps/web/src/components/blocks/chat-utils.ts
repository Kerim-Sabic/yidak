import type { ChatMessage, ChatMessageType } from '@/components/blocks/chat-models';

export const fallbackConversationId = '00000000-0000-4000-8000-000000000000';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const readString = (value: Record<string, unknown>, key: string): string => {
  const candidate = Reflect.get(value, key);
  return typeof candidate === 'string' ? candidate : '';
};

export const readNullableString = (value: Record<string, unknown>, key: string): string | null => {
  const candidate = Reflect.get(value, key);
  return typeof candidate === 'string' ? candidate : null;
};

export const readNumber = (value: Record<string, unknown>, key: string): number | null => {
  const candidate = Reflect.get(value, key);
  return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : null;
};

export const toMessageType = (value: string): ChatMessageType => {
  if (value === 'image') {
    return 'image';
  }

  if (value === 'voice') {
    return 'voice';
  }

  if (value === 'location') {
    return 'location';
  }

  if (value === 'system') {
    return 'system';
  }

  return 'text';
};

export const toRealtimeMessage = (payload: unknown): ChatMessage | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const nested = Reflect.get(payload, 'new');
  const row = isRecord(nested) ? nested : payload;
  const id = readString(row, 'id');
  if (!id) {
    return null;
  }

  const metadata = Reflect.get(row, 'metadata');
  return {
    id,
    conversation_id: readString(row, 'conversation_id'),
    sender_id: readString(row, 'sender_id'),
    content: readString(row, 'content'),
    type: toMessageType(readString(row, 'type')),
    metadata: isRecord(metadata) ? metadata : null,
    read_at: readNullableString(row, 'read_at'),
    created_at: readString(row, 'created_at')
  };
};

export const sortMessagesAscending = (
  messages: ReadonlyArray<ChatMessage>
): ReadonlyArray<ChatMessage> =>
  [...messages].sort((left, right) => {
    const leftTime = new Date(left.created_at).getTime();
    const rightTime = new Date(right.created_at).getTime();
    return leftTime - rightTime;
  });

export const mergeChatMessages = (
  current: ReadonlyArray<ChatMessage>,
  nextBatch: ReadonlyArray<ChatMessage>
): ReadonlyArray<ChatMessage> => {
  const map = new Map<string, ChatMessage>();
  current.forEach((message) => {
    map.set(message.id, message);
  });

  nextBatch.forEach((message) => {
    const existing = map.get(message.id);
    map.set(message.id, existing ? { ...existing, ...message } : message);
  });

  return sortMessagesAscending([...map.values()]);
};

const isSameDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const formatDateSeparator = (iso: string, locale: 'en' | 'ar', today: string, yesterday: string): string => {
  const date = new Date(iso);
  const now = new Date();
  if (isSameDay(date, now)) {
    return today;
  }

  const previous = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (isSameDay(date, previous)) {
    return yesterday;
  }

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

export const formatMessageTime = (iso: string, locale: 'en' | 'ar'): string =>
  new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso));

export const formatConversationTime = (iso: string | null, locale: 'en' | 'ar'): string => {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);
  const now = new Date();
  if (isSameDay(date, now)) {
    return formatMessageTime(iso, locale);
  }

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
    day: '2-digit',
    month: 'short'
  }).format(date);
};

export const throttle = <TArgs extends ReadonlyArray<unknown>>(
  callback: (...args: TArgs) => void,
  delayMs: number
): ((...args: TArgs) => void) => {
  let nextAllowedTime = 0;

  return (...args: TArgs): void => {
    const now = Date.now();
    if (now < nextAllowedTime) {
      return;
    }

    nextAllowedTime = now + delayMs;
    callback(...args);
  };
};

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to load image'));
    };
    image.src = objectUrl;
  });

export const compressImageFile = async (file: File): Promise<File> => {
  try {
    const image = await loadImage(file);
    const maxDimension = 1920;
    const maxBytes = 1_000_000;

    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, width, height);

    let quality = 0.9;
    let blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });

    while (blob && blob.size > maxBytes && quality > 0.45) {
      quality -= 0.1;
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', quality);
      });
    }

    if (!blob) {
      return file;
    }

    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
};

export const buildWaveformBars = (seed: string, count: number): ReadonlyArray<number> => {
  const bars: number[] = [];
  const valueSeed = seed.length > 0 ? seed : 'wave';

  for (let index = 0; index < count; index += 1) {
    const character = valueSeed.charCodeAt(index % valueSeed.length);
    const height = 25 + ((character + index * 11) % 70);
    bars.push(height);
  }

  return bars;
};

export const toMapLink = (latitude: number, longitude: number): string =>
  `https://www.google.com/maps?q=${latitude},${longitude}`;

