import { db } from '@yidak/db';
import { jobs, notifications, profiles } from '@yidak/db/schema';
import { isWithinPrayerTime } from '@yidak/utils';
import { and, eq, sql } from 'drizzle-orm';

import type { NotificationType } from '@yidak/types';

interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  data?: Record<string, unknown>;
}

type NotificationPreferences = {
  quietHours?: {
    enabled?: boolean;
    prayerAware?: boolean;
  };
};

type ProfileMetadata = {
  latitude?: number;
  longitude?: number;
  notification_preferences?: NotificationPreferences;
  [key: string]: unknown;
};

const criticalTypes = new Set<NotificationType>(['bid_accepted', 'payment_released']);

const readMetadata = (value: unknown): ProfileMetadata => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as ProfileMetadata;
};

const readLocation = (metadata: ProfileMetadata): { latitude: number; longitude: number } => {
  const latitude = typeof metadata.latitude === 'number' ? metadata.latitude : 25.2048;
  const longitude = typeof metadata.longitude === 'number' ? metadata.longitude : 55.2708;
  return { latitude, longitude };
};

const shouldSkipPush = (type: NotificationType, metadata: ProfileMetadata): boolean => {
  const quietHours = metadata.notification_preferences?.quietHours;
  const quietEnabled = quietHours?.enabled === true || quietHours?.prayerAware === true;
  if (!quietEnabled || criticalTypes.has(type)) {
    return false;
  }

  const location = readLocation(metadata);
  return isWithinPrayerTime(new Date(), location.latitude, location.longitude);
};

export const sendNotification = async (input: NotifyInput) => {
  const [notification] = await db
    .insert(notifications)
    .values({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: {
        title_ar: input.titleAr,
        body_ar: input.bodyAr,
        ...(input.data ?? {})
      }
    })
    .returning();

  if (!notification) {
    throw new Error('Failed to insert notification');
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, input.userId)
  });

  if (!profile) {
    return notification;
  }

  const metadata = readMetadata(profile.metadata);
  if (shouldSkipPush(input.type, metadata)) {
    return notification;
  }

  // Placeholder for push delivery integration (FCM/APNs).
  return notification;
};

const rowUserId = (row: unknown): string | null => {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return null;
  }

  const value = Reflect.get(row, 'user_id');
  return typeof value === 'string' ? value : null;
};

export const notifyNearbyWorkers = async (jobId: string, radiusKm: number): Promise<number> => {
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, jobId)
  });

  if (!job) {
    return 0;
  }

  const meters = Math.max(1, Math.round(radiusKm * 1000));
  const workerRows = await db.execute(
    sql`
      select wp.user_id
      from worker_profiles wp
      where wp.is_available = true
        and ST_DWithin(wp.location, ${job.location}, ${meters})
    `
  );

  const workerIds = workerRows
    .map((row: unknown) => rowUserId(row))
    .filter((value: string | null): value is string => value !== null);

  await Promise.all(
    workerIds.map(async (workerId: string) =>
      sendNotification({
        userId: workerId,
        type: 'job_posted',
        title: 'New job near you',
        titleAr: 'وظيفة جديدة بالقرب منك',
        body: 'A new customer job matches your area and skills.',
        bodyAr: 'هناك وظيفة جديدة تتناسب مع نطاق خدمتك.',
        data: {
          job_id: jobId
        }
      })
    )
  );

  return workerIds.length;
};

export const markNotificationRead = async (
  userId: string,
  notificationId: string
): Promise<boolean> => {
  const [updated] = await db
    .update(notifications)
    .set({ is_read: true, read_at: new Date() })
    .where(and(eq(notifications.user_id, userId), eq(notifications.id, notificationId)))
    .returning({ id: notifications.id });

  return Boolean(updated);
};
