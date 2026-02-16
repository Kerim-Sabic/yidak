'use client';

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { Appearance } from '@stripe/stripe-js';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getStripe } from '@/lib/stripe';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';

interface PaymentFlowData {
  id: string;
  jobId: string;
  bidId: string | null;
  jobTitle: string;
  amount: number;
  currency: 'AED' | 'SAR' | 'QAR' | 'BHD' | 'KWD' | 'OMR';
  status: string;
  stripePaymentIntentId?: string | null;
}

interface PaymentFlowProps {
  locale: 'en' | 'ar';
  data: PaymentFlowData | null;
  onRefresh?: () => void;
}

interface StripeCheckoutFormProps {
  locale: 'en' | 'ar';
  onSuccess: () => void;
  onError: (message: string) => void;
}

const formatMoney = (
  amount: number,
  currency: PaymentFlowData['currency'],
  locale: 'en' | 'ar',
): string =>
  new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en', {
    style: 'currency',
    currency,
  }).format(amount);

const StripeCheckoutForm = ({ locale, onSuccess, onError }: StripeCheckoutFormProps): React.JSX.Element => {
  const t = useTranslations('customer.payments.flow');
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleConfirm = async (): Promise<void> => {
    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/${locale}/payments`;
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: 'if_required',
    });
    setIsSubmitting(false);

    if (result.error) {
      onError(result.error.message ?? t('messages.failed'));
      return;
    }

    onSuccess();
  };

  return (
    <div className="space-y-3">
      <PaymentElement />
      <Button
        className="w-full"
        onClick={() => {
          void handleConfirm();
        }}
        disabled={!stripe || isSubmitting}
      >
        {isSubmitting ? t('actions.authorizing') : t('actions.complete3ds')}
      </Button>
    </div>
  );
};

export const PaymentFlow = ({ locale, data, onRefresh }: PaymentFlowProps): React.JSX.Element => {
  const t = useTranslations('customer.payments.flow');
  const reducedMotion = useReducedMotion() ?? false;
  const [step, setStep] = useState<number>(0);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const authorizeMutation = trpc.payment.authorizeEscrow.useMutation();

  const stepTitles = [t('steps.summary'), t('steps.method'), t('steps.secure'), t('steps.confirm')];
  const serviceFee = useMemo(() => (data ? data.amount * 0.18 : 0), [data]);
  const totalHold = useMemo(() => (data ? data.amount : 0), [data]);

  const appearance = useMemo<Appearance>(
    () => ({
      theme: 'stripe',
      variables: {
        colorPrimary: '#0d9488',
        borderRadius: '12px',
        fontFamily: 'Inter, IBM Plex Arabic, system-ui',
      },
    }),
    [],
  );

  const proceedToCheckout = async (): Promise<void> => {
    if (!data) {
      toast.error(t('messages.noPayment'));
      return;
    }

    if (!data.bidId && data.status === 'pending') {
      toast.error(t('messages.noPayment'));
      return;
    }

    if (data.status !== 'pending') {
      setStep(2);
      return;
    }

    if (!data.bidId) {
      toast.error(t('messages.failed'));
      return;
    }

    try {
      const result = await authorizeMutation.mutateAsync({
        job_id: data.jobId,
        bid_id: data.bidId,
        amount: data.amount,
        currency: data.currency,
      });

      setClientSecret(result.clientSecret);
      setStep(2);
      onRefresh?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('messages.failed');
      toast.error(message);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{t('title')}</h2>
          <Badge className="gap-1" variant="secondary">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {t('shariahBadge')}
          </Badge>
        </div>
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stepTitles.map((stepLabel, index) => (
            <li key={stepLabel} className="space-y-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  initial={reducedMotion ? false : { width: 0 }}
                  animate={{ width: `${index <= step ? 100 : 0}%` }}
                  transition={{ type: 'spring', stiffness: 240, damping: 26 }}
                />
              </div>
              <p className={cn('text-xs text-muted-foreground', index <= step && 'font-medium text-foreground')}>
                {stepLabel}
              </p>
            </li>
          ))}
        </ol>
      </header>

      {!data ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">{t('emptySelection')}</CardContent>
        </Card>
      ) : null}

      {data && step === 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('summary.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-sm font-medium">{data.jobTitle}</p>
              <p className="text-xs text-muted-foreground">{t('summary.jobRef', { id: data.jobId })}</p>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt>{t('summary.acceptedBid')}</dt>
                <dd>{formatMoney(data.amount, data.currency, locale)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt>{t('summary.serviceFee')}</dt>
                <dd>{formatMoney(serviceFee, data.currency, locale)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 font-semibold">
                <dt>{t('summary.totalHold')}</dt>
                <dd>{formatMoney(totalHold, data.currency, locale)}</dd>
              </div>
            </dl>
            <p className="text-sm text-muted-foreground">{t('summary.escrowNote')}</p>
            <Button
              className="w-full"
              onClick={() => {
                setStep(1);
              }}
            >
              {t('actions.continue')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {data && step === 1 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('method.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
              <p className="inline-flex items-center gap-2 font-medium">
                <CreditCard className="h-4 w-4" aria-hidden />
                {t('method.savedCard')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t('method.recommended')}</p>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                void proceedToCheckout();
              }}
              disabled={authorizeMutation.isPending}
            >
              {authorizeMutation.isPending ? t('actions.authorizing') : t('actions.authorize')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {data && step === 2 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('secure.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('secure.description')}</p>
            {clientSecret ? (
              <Elements
                stripe={getStripe()}
                options={{
                  clientSecret,
                  appearance,
                  locale: locale === 'ar' ? 'ar' : 'en',
                }}
              >
                <StripeCheckoutForm
                  locale={locale}
                  onSuccess={() => {
                    toast.success(t('confirm.message'));
                    setStep(3);
                    onRefresh?.();
                  }}
                  onError={(message) => {
                    toast.error(message);
                  }}
                />
              </Elements>
            ) : (
              <p className="rounded-xl border border-border p-3 text-sm text-muted-foreground">
                {t('messages.noPayment')}
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {data && step === 3 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('confirm.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <motion.div
              initial={reducedMotion ? false : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="flex items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-emerald-700"
            >
              <CheckCircle2 className="h-10 w-10" aria-hidden />
            </motion.div>
            <p className="text-center text-sm">{t('confirm.message')}</p>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setStep(0);
              }}
            >
              {t('actions.startAgain')}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
};

export default PaymentFlow;
