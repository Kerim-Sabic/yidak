'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Download, Filter, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { EscrowStatus } from '@/components/blocks/EscrowStatus';
import { PaymentFlow } from '@/components/blocks/PaymentFlow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc/client';

interface CustomerPaymentsPanelProps {
  locale: 'en' | 'ar';
}

type StatusFilter =
  | 'all'
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'voided'
  | 'refunded'
  | 'failed'
  | 'disputed';
type DateFilter = 'all' | '7' | '30' | '90';

const statusVariants: Readonly<Record<StatusFilter, 'default' | 'secondary' | 'destructive' | 'outline'>> = {
  all: 'secondary',
  pending: 'secondary',
  authorized: 'default',
  captured: 'default',
  voided: 'outline',
  refunded: 'outline',
  failed: 'destructive',
  disputed: 'destructive'
};

const normalizeStatus = (status: string): StatusFilter => {
  if (
    status === 'pending' ||
    status === 'authorized' ||
    status === 'captured' ||
    status === 'voided' ||
    status === 'refunded' ||
    status === 'failed' ||
    status === 'disputed'
  ) {
    return status;
  }

  return 'pending';
};

const normalizeDateFilter = (value: string): DateFilter => {
  if (value === '7' || value === '30' || value === '90' || value === 'all') {
    return value;
  }

  return 'all';
};

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

export const CustomerPaymentsPanel = ({ locale }: CustomerPaymentsPanelProps): React.JSX.Element => {
  const t = useTranslations('customer.payments');
  const reducedMotion = useReducedMotion() ?? false;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const paymentsQuery = trpc.payment.listPayments.useQuery();
  const jobsQuery = trpc.job.listByCustomer.useQuery();

  const jobById = useMemo(() => {
    const map = new Map<string, { title: string }>();
    (jobsQuery.data ?? []).forEach((job) => {
      map.set(job.id, {
        title: job.title,
      });
    });
    return map;
  }, [jobsQuery.data]);

  const filteredPayments = useMemo(() => {
    const now = Date.now();
    return (paymentsQuery.data?.items ?? []).filter((payment) => {
      const statusPass = statusFilter === 'all' || payment.status === statusFilter;
      if (!statusPass) {
        return false;
      }

      if (dateFilter === 'all') {
        return true;
      }

      const paymentDate = parseDate(payment.created_at);
      if (!paymentDate) {
        return false;
      }

      const days = Number(dateFilter);
      return now - paymentDate.getTime() <= days * 24 * 60 * 60 * 1000;
    });
  }, [dateFilter, paymentsQuery.data?.items, statusFilter]);

  const totals = useMemo(() => {
    return filteredPayments.reduce(
      (accumulator, payment) => {
        if (payment.status === 'captured') {
          return {
            spent: accumulator.spent + payment.amount,
            count: accumulator.count + 1
          };
        }

        return accumulator;
      },
      { spent: 0, count: 0 }
    );
  }, [filteredPayments]);

  const selectedPayment = filteredPayments[0] ?? null;
  const selectedJob = selectedPayment ? jobById.get(selectedPayment.job_id) : null;
  const selectedJobTitle = selectedJob?.title ?? t('history.jobFallback');

  const downloadReceipt = (paymentId: string): void => {
    const selected = filteredPayments.find((payment) => payment.id === paymentId);
    if (!selected) {
      toast.error(t('history.receiptError'));
      return;
    }

    const content = [
      `${t('history.receiptTitle')}: ${selected.id}`,
      `${t('history.receiptJob')}: ${jobById.get(selected.job_id)?.title ?? t('history.jobFallback')}`,
      `${t('history.receiptAmount')}: ${formatMoney(selected.amount, selected.currency, locale)}`,
      `${t('history.receiptStatus')}: ${selected.status}`,
      `${t('history.receiptDate')}: ${selected.created_at}`
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `yidak-receipt-${selected.id}.txt`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  if (paymentsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-52" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        className="grid grid-cols-1 gap-3 lg:grid-cols-3"
      >
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('summary.title')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">{t('summary.totalSpent')}</p>
              <p className="text-2xl font-semibold">
                {formatMoney(totals.spent, selectedPayment?.currency ?? 'AED', locale)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">{t('summary.capturedCount')}</p>
              <p className="text-2xl font-semibold">{totals.count}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="inline-flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" aria-hidden />
              {t('filters.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('filters.status')}</p>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(normalizeStatus(value));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('status.all')}</SelectItem>
                  <SelectItem value="pending">{t('status.pending')}</SelectItem>
                  <SelectItem value="authorized">{t('status.authorized')}</SelectItem>
                  <SelectItem value="captured">{t('status.captured')}</SelectItem>
                  <SelectItem value="voided">{t('status.voided')}</SelectItem>
                  <SelectItem value="refunded">{t('status.refunded')}</SelectItem>
                  <SelectItem value="failed">{t('status.failed')}</SelectItem>
                  <SelectItem value="disputed">{t('status.disputed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('filters.dateRange')}</p>
              <Select
                value={dateFilter}
                onValueChange={(value) => {
                  setDateFilter(normalizeDateFilter(value));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dateRange.all')}</SelectItem>
                  <SelectItem value="7">{t('dateRange.last7')}</SelectItem>
                  <SelectItem value="30">{t('dateRange.last30')}</SelectItem>
                  <SelectItem value="90">{t('dateRange.last90')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <PaymentFlow
        locale={locale}
        data={
          selectedPayment
            ? {
                id: selectedPayment.id,
                jobId: selectedPayment.job_id,
                bidId: null,
                jobTitle: selectedJobTitle,
                amount: selectedPayment.amount,
                currency:
                  selectedPayment.currency === 'AED' ||
                  selectedPayment.currency === 'SAR' ||
                  selectedPayment.currency === 'QAR' ||
                  selectedPayment.currency === 'BHD' ||
                  selectedPayment.currency === 'KWD' ||
                  selectedPayment.currency === 'OMR'
                    ? selectedPayment.currency
                    : 'AED',
                status: selectedPayment.status
              }
            : null
        }
        onRefresh={() => {
          void paymentsQuery.refetch();
        }}
      />

      {selectedPayment ? (
        <EscrowStatus
          amount={selectedPayment.amount}
          currency={selectedPayment.currency}
          locale={locale}
          activeStep={selectedPayment.status === 'captured' ? 3 : 0}
          authorizedAt={selectedPayment.authorized_at}
          expectedReleaseAt={selectedPayment.created_at}
          labels={{
            fundsHeld: t('escrow.fundsHeld'),
            workInProgress: t('escrow.workInProgress'),
            completed: t('escrow.completed'),
            released: t('escrow.released'),
            amountHeld: t('escrow.amountHeld'),
            authorizedAt: t('escrow.authorizedAt'),
            expectedRelease: t('escrow.expectedRelease'),
            pendingDate: t('escrow.pendingDate')
          }}
        />
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="inline-flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" aria-hidden />
            {t('history.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredPayments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              {t('history.empty')}
            </p>
          ) : (
            filteredPayments.map((payment) => (
              <article key={payment.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {jobById.get(payment.job_id)?.title ?? t('history.jobFallback')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      }).format(parseDate(payment.created_at) ?? new Date())}
                    </p>
                  </div>
                  <Badge variant={statusVariants[normalizeStatus(payment.status)]}>
                    {t(`status.${normalizeStatus(payment.status)}`)}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {formatMoney(payment.amount, payment.currency, locale)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      downloadReceipt(payment.id);
                    }}
                  >
                    <Download className="me-1 h-4 w-4" aria-hidden />
                    {t('history.downloadReceipt')}
                  </Button>
                </div>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerPaymentsPanel;
