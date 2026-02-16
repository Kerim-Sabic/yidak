'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc/client';

interface NotificationPreferencesFormProps {
  locale: 'en' | 'ar';
}

interface Preferences {
  types: Record<string, { push: boolean; in_app: boolean }>;
  quiet_hours: {
    prayer_aware: boolean;
    enabled: boolean;
    start: string;
    end: string;
  };
  language: 'en' | 'ar';
  sound_enabled: boolean;
  batch_bid_notifications: boolean;
}

const typesOrder = [
  'new_bid',
  'bid_accepted',
  'outbid',
  'job_posted',
  'message_received',
  'payment_authorized',
  'payment_released',
  'review_received',
  'tier_upgrade',
  'referral_credit'
] as const;

const ToggleRow = ({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}): React.JSX.Element => (
  <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
    <span className="text-sm">{label}</span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => {
        onChange(event.target.checked);
      }}
      className="h-4 w-4 rounded border-border"
    />
  </label>
);

export const NotificationPreferencesForm = ({
  locale
}: NotificationPreferencesFormProps): React.JSX.Element => {
  void locale;
  const t = useTranslations('notificationPreferences');
  const preferencesQuery = trpc.notification.getPreferences.useQuery();
  const updatePreferences = trpc.notification.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success(t('saved'));
    }
  });

  const [preferences, setPreferences] = useState<Preferences | null>(null);

  useEffect(() => {
    if (preferencesQuery.data) {
      setPreferences(preferencesQuery.data);
    }
  }, [preferencesQuery.data]);

  const canSave = useMemo(
    () => !updatePreferences.isPending && preferences !== null,
    [preferences, updatePreferences.isPending]
  );

  if (!preferences) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('typesTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {typesOrder.map((type) => {
            const existing = preferences.types[type] ?? { push: true, in_app: true };
            return (
              <div key={type} className="rounded-xl border border-border p-3">
                <p className="mb-2 text-sm font-medium">{t(`types.${type}`)}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <ToggleRow
                    label={t('push')}
                    checked={existing.push}
                    onChange={(next) => {
                      setPreferences((previous) =>
                        previous
                          ? {
                              ...previous,
                              types: {
                                ...previous.types,
                                [type]: { ...existing, push: next }
                              }
                            }
                          : previous
                      );
                    }}
                  />
                  <ToggleRow
                    label={t('inApp')}
                    checked={existing.in_app}
                    onChange={(next) => {
                      setPreferences((previous) =>
                        previous
                          ? {
                              ...previous,
                              types: {
                                ...previous.types,
                                [type]: { ...existing, in_app: next }
                              }
                            }
                          : previous
                      );
                    }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('quietHoursTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow
            label={t('prayerAware')}
            checked={preferences.quiet_hours.prayer_aware}
            onChange={(next) => {
              setPreferences((previous) =>
                previous
                  ? {
                      ...previous,
                      quiet_hours: { ...previous.quiet_hours, prayer_aware: next }
                    }
                  : previous
              );
            }}
          />
          <ToggleRow
            label={t('quietEnabled')}
            checked={preferences.quiet_hours.enabled}
            onChange={(next) => {
              setPreferences((previous) =>
                previous
                  ? {
                      ...previous,
                      quiet_hours: { ...previous.quiet_hours, enabled: next }
                    }
                  : previous
              );
            }}
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="quiet-start">{t('quietStart')}</Label>
              <Input
                id="quiet-start"
                value={preferences.quiet_hours.start}
                onChange={(event) => {
                  const value = event.target.value;
                  setPreferences((previous) =>
                    previous
                      ? {
                          ...previous,
                          quiet_hours: { ...previous.quiet_hours, start: value }
                        }
                      : previous
                  );
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quiet-end">{t('quietEnd')}</Label>
              <Input
                id="quiet-end"
                value={preferences.quiet_hours.end}
                onChange={(event) => {
                  const value = event.target.value;
                  setPreferences((previous) =>
                    previous
                      ? {
                          ...previous,
                          quiet_hours: { ...previous.quiet_hours, end: value }
                        }
                      : previous
                  );
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('otherTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>{t('language')}</Label>
            <Select
              value={preferences.language}
              onValueChange={(value: 'en' | 'ar') => {
                setPreferences((previous) =>
                  previous
                    ? {
                        ...previous,
                        language: value
                      }
                    : previous
                );
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('english')}</SelectItem>
                <SelectItem value="ar">{t('arabic')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ToggleRow
            label={t('soundEnabled')}
            checked={preferences.sound_enabled}
            onChange={(next) => {
              setPreferences((previous) =>
                previous
                  ? {
                      ...previous,
                      sound_enabled: next
                    }
                  : previous
              );
            }}
          />

          <ToggleRow
            label={t('batchBids')}
            checked={preferences.batch_bid_notifications}
            onChange={(next) => {
              setPreferences((previous) =>
                previous
                  ? {
                      ...previous,
                      batch_bid_notifications: next
                    }
                  : previous
              );
            }}
          />
        </CardContent>
      </Card>

      <Button
        type="button"
        disabled={!canSave}
        onClick={() => {
          void updatePreferences.mutateAsync(preferences);
        }}
      >
        {updatePreferences.isPending ? t('saving') : t('save')}
      </Button>
    </section>
  );
};

export default NotificationPreferencesForm;
