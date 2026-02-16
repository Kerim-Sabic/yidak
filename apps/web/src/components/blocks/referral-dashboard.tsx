'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Copy, Mail, MessageCircle, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/lib/trpc/client';

interface ReferralDashboardProps {
  locale: 'en' | 'ar';
}

const statusVariant = (status: string): 'secondary' | 'default' | 'outline' => {
  if (status === 'credited') {
    return 'default';
  }

  if (status === 'completed') {
    return 'secondary';
  }

  return 'outline';
};

export const ReferralDashboard = ({ locale }: ReferralDashboardProps): React.JSX.Element => {
  const t = useTranslations('referrals');
  const reducedMotion = useReducedMotion() ?? false;
  const overviewQuery = trpc.referral.getOverview.useQuery();

  const progressPercent = useMemo(() => {
    const data = overviewQuery.data;
    if (!data) {
      return 0;
    }

    const next = data.tier_progress.next_threshold;
    if (!next || next <= 0) {
      return 100;
    }

    return Math.max(0, Math.min(100, (data.stats.successful_referrals / next) * 100));
  }, [overviewQuery.data]);

  if (overviewQuery.isLoading || !overviewQuery.data) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }

  const data = overviewQuery.data;
  const message = locale === 'ar' ? data.referral_message_ar : data.referral_message_en;
  const encodedMessage = encodeURIComponent(message);
  const encodedLink = encodeURIComponent(data.share_link);
  const whatsappLink = `https://wa.me/?text=${encodedMessage}%20${encodedLink}`;
  const smsLink = `sms:?&body=${encodedMessage}%20${encodedLink}`;
  const emailLink = `mailto:?subject=${encodeURIComponent(t('emailSubject'))}&body=${encodedMessage}%20${encodedLink}`;

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('yourCodeTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-3xl font-bold tracking-[0.3em]">{data.code}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(data.code);
                toast.success(t('copiedCode'));
              }}
            >
              <Copy className="h-4 w-4" />
              {t('copyCode')}
            </Button>
            <Button asChild>
              <a href={whatsappLink} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" />
                {t('shareWhatsApp')}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={smsLink}>
                <Smartphone className="h-4 w-4" />
                {t('shareSms')}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={emailLink}>
                <Mail className="h-4 w-4" />
                {t('shareEmail')}
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(data.share_link);
                toast.success(t('copiedLink'));
              }}
            >
              <Copy className="h-4 w-4" />
              {t('copyLink')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('stats.totalReferrals')}</p>
            <p className="text-2xl font-semibold">{data.stats.total_referrals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('stats.successful')}</p>
            <p className="text-2xl font-semibold">{data.stats.successful_referrals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('stats.earned')}</p>
            <p className="text-2xl font-semibold">AED {data.stats.earned_amount.toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('tierTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <p>{t('currentReward', { amount: data.tier_progress.current_rate })}</p>
            {data.tier_progress.next_rate ? (
              <p className="text-muted-foreground">{t('nextReward', { amount: data.tier_progress.next_rate })}</p>
            ) : (
              <Badge>{t('maxTier')}</Badge>
            )}
          </div>
          <Progress value={progressPercent} />
          {data.tier_progress.next_threshold ? (
            <p className="text-xs text-muted-foreground">
              {t('toNextTier', { count: data.tier_progress.remaining_to_next_tier })}
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-lg border p-2">1-5: AED 50</div>
            <div className="rounded-lg border p-2">6-15: AED 75</div>
            <div className="rounded-lg border p-2">16+: AED 100</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('historyTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('historyEmpty')}</p>
          ) : (
            data.history.map((item, index) => (
              <motion.div
                key={item.id}
                {...(reducedMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 8 },
                      animate: { opacity: 1, y: 0 }
                    })}
                transition={{ type: 'spring', stiffness: 160, damping: 20, delay: index * 0.03 }}
                className="flex items-center justify-between gap-2 rounded-xl border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{item.referee_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-end">
                  <Badge variant={statusVariant(item.status)}>{t(`status.${item.status}`)}</Badge>
                  <p className="mt-1 text-xs text-muted-foreground">AED {item.reward_amount.toFixed(0)}</p>
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default ReferralDashboard;

