'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc/client';

interface WorkerEarningsPanelProps {
  locale: 'en' | 'ar';
}

interface ChartPoint {
  label: string;
  value: number;
}

const COLORS = ['#0f766e', '#d97706', '#16a34a', '#7c3aed', '#2563eb', '#db2777'];

const parseDate = (value: string): Date | null => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const formatMoney = (amount: number, currency: string, locale: 'en' | 'ar'): string =>
  new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en', {
    style: 'currency',
    currency
  }).format(amount);

const readCategory = (metadata: unknown, fallback: string): string => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return fallback;
  }

  const metadataRecord: Record<string, unknown> = {};
  Object.entries(metadata).forEach(([key, value]) => {
    metadataRecord[key] = value;
  });
  const categoryValue =
    Reflect.get(metadataRecord, 'category') ?? Reflect.get(metadataRecord, 'job_category');

  return typeof categoryValue === 'string' && categoryValue.length > 0 ? categoryValue : fallback;
};

export const WorkerEarningsPanel = ({ locale }: WorkerEarningsPanelProps): React.JSX.Element => {
  const t = useTranslations('worker.earnings');
  const profileQuery = trpc.user.getProfile.useQuery();
  const paymentsQuery = trpc.payment.listPayments.useQuery();
  const connectOnboardMutation = trpc.payment.connectOnboard.useMutation({
    onSuccess: (result) => {
      window.location.href = result.onboardingUrl;
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const workerPayments = useMemo(() => {
    if (!profileQuery.data) {
      return [];
    }

    return (paymentsQuery.data?.items ?? []).filter(
      (payment) => payment.worker_id === profileQuery.data.id
    );
  }, [paymentsQuery.data?.items, profileQuery.data]);

  const capturedPayments = useMemo(
    () => workerPayments.filter((payment) => payment.status === 'captured'),
    [workerPayments]
  );

  const pendingPayouts = useMemo(
    () =>
      workerPayments
        .filter((payment) => payment.status === 'authorized')
        .reduce((sum, payment) => sum + payment.worker_payout, 0),
    [workerPayments]
  );

  const totals = useMemo(() => {
    const totalEarned = capturedPayments.reduce((sum, payment) => sum + payment.worker_payout, 0);
    const averagePerJob = capturedPayments.length > 0 ? totalEarned / capturedPayments.length : 0;

    const now = new Date();
    const thisMonth = capturedPayments
      .filter((payment) => {
        const date = parseDate(payment.captured_at ?? payment.created_at);
        if (!date) {
          return false;
        }

        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, payment) => sum + payment.worker_payout, 0);

    return {
      totalEarned,
      thisMonth,
      averagePerJob
    };
  }, [capturedPayments]);

  const monthlyData = useMemo(() => {
    const labels: ChartPoint[] = [];
    const current = new Date();

    for (let index = 5; index >= 0; index -= 1) {
      const pointDate = new Date(current.getFullYear(), current.getMonth() - index, 1);
      const label = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
        month: 'short'
      }).format(pointDate);

      const value = capturedPayments
        .filter((payment) => {
          const date = parseDate(payment.captured_at ?? payment.created_at);
          return (
            !!date &&
            date.getMonth() === pointDate.getMonth() &&
            date.getFullYear() === pointDate.getFullYear()
          );
        })
        .reduce((sum, payment) => sum + payment.worker_payout, 0);

      labels.push({ label, value });
    }

    return labels;
  }, [capturedPayments, locale]);

  const weeklyData = useMemo(() => {
    const labels: ChartPoint[] = [];
    const now = new Date();

    for (let index = 6; index >= 0; index -= 1) {
      const pointDate = new Date(now);
      pointDate.setDate(now.getDate() - index);
      const label = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
        weekday: 'short'
      }).format(pointDate);

      const value = capturedPayments
        .filter((payment) => {
          const date = parseDate(payment.captured_at ?? payment.created_at);
          return (
            !!date &&
            date.getDate() === pointDate.getDate() &&
            date.getMonth() === pointDate.getMonth() &&
            date.getFullYear() === pointDate.getFullYear()
          );
        })
        .reduce((sum, payment) => sum + payment.worker_payout, 0);

      labels.push({ label, value });
    }

    return labels;
  }, [capturedPayments, locale]);

  const categoryData = useMemo(() => {
    const accumulator = new Map<string, number>();
    capturedPayments.forEach((payment) => {
      const key = readCategory(payment.metadata, t('charts.categoryFallback'));
      accumulator.set(key, (accumulator.get(key) ?? 0) + payment.worker_payout);
    });

    return Array.from(accumulator.entries()).map(([label, value]) => ({ label, value }));
  }, [capturedPayments, t]);

  if (profileQuery.isLoading || paymentsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const currency = workerPayments[0]?.currency ?? 'AED';

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t('summary.totalEarned')}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(totals.totalEarned, currency, locale)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t('summary.thisMonth')}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(totals.thisMonth, currency, locale)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t('summary.pendingPayouts')}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(pendingPayouts, currency, locale)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t('summary.averagePerJob')}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(totals.averagePerJob, currency, locale)}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t('charts.monthly')}</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => formatMoney(Number(value), currency, locale)} />
                <Bar dataKey="value" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('charts.byCategory')}</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="label" outerRadius={90}>
                  {categoryData.map((entry, index) => {
                    const color = COLORS[index % COLORS.length] ?? '#0f766e';
                    return <Cell key={`${entry.label}-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(Number(value), currency, locale)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('charts.weekly')}</CardTitle>
        </CardHeader>
        <CardContent className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value) => formatMoney(Number(value), currency, locale)} />
              <Line type="monotone" dataKey="value" stroke="#d97706" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{t('transactions.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {capturedPayments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              {t('transactions.empty')}
            </p>
          ) : (
            capturedPayments.map((payment) => (
              <div key={payment.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{payment.job_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
                      dateStyle: 'medium'
                    }).format(parseDate(payment.captured_at ?? payment.created_at) ?? new Date())}
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                  <p>
                    {t('transactions.gross')}: {formatMoney(payment.amount, payment.currency, locale)}
                  </p>
                  <p>
                    {t('transactions.platformFee')}:{' '}
                    {formatMoney(payment.platform_fee, payment.currency, locale)}
                  </p>
                  <p className="font-semibold">
                    {t('transactions.net')}: {formatMoney(payment.worker_payout, payment.currency, locale)}
                  </p>
                </div>
              </div>
            ))
          )}
          <Button
            variant="default"
            className="w-full"
            onClick={() => {
              connectOnboardMutation.mutate();
            }}
            disabled={connectOnboardMutation.isPending}
          >
            {connectOnboardMutation.isPending ? t('requestPayout') : 'Set Up Payouts'}
          </Button>
          <Button variant="secondary" className="w-full" disabled>
            {t('requestPayout')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkerEarningsPanel;
