import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

// BHD, KWD, OMR use 3 decimal places (1000 subunits); rest use 2 (100 subunits)
const THREE_DECIMAL = new Set(['bhd', 'kwd', 'omr']);

export function toSmallestUnit(amount: number, currency: string): number {
  return Math.round(amount * (THREE_DECIMAL.has(currency.toLowerCase()) ? 1000 : 100));
}

export function fromSmallestUnit(amount: number, currency: string): number {
  return amount / (THREE_DECIMAL.has(currency.toLowerCase()) ? 1000 : 100);
}

export async function authorizeEscrow(input: {
  amount: number;
  currency: string;
  customerId: string;
  jobId: string;
  workerConnectAccountId?: string;
  description: string;
  metadata: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount: input.amount,
    currency: input.currency.toLowerCase(),
    customer: input.customerId,
    capture_method: 'manual',
    automatic_payment_methods: { enabled: true },
    description: input.description,
    metadata: { job_id: input.jobId, platform: 'yidak', ...input.metadata },
    ...(input.workerConnectAccountId && {
      transfer_data: { destination: input.workerConnectAccountId },
      application_fee_amount: Math.round(input.amount * 0.18),
    }),
  });
}

export async function capturePayment(
  paymentIntentId: string,
  amountToCapture?: number,
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.capture(
    paymentIntentId,
    amountToCapture ? { amount_to_capture: amountToCapture } : {},
  );
}

export async function voidPayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.cancel(paymentIntentId);
}

export async function refundPayment(
  paymentIntentId: string,
  amount: number,
  reason: string,
): Promise<Stripe.Refund> {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount,
    reason: 'requested_by_customer',
    metadata: { reason },
  });
}

export async function createCustomer(input: {
  name: string;
  email?: string;
  phone: string;
  userId: string;
}): Promise<Stripe.Customer> {
  const customerPayload: Stripe.CustomerCreateParams = {
    name: input.name,
    phone: input.phone,
    metadata: { user_id: input.userId, platform: 'yidak' },
    ...(input.email ? { email: input.email } : {}),
  };

  return stripe.customers.create({
    ...customerPayload,
  });
}

export async function createConnectAccount(input: {
  email: string;
  country: string;
  userId: string;
}): Promise<Stripe.Account> {
  return stripe.accounts.create({
    type: 'express',
    country: input.country,
    email: input.email,
    capabilities: { transfers: { requested: true } },
    metadata: { user_id: input.userId, platform: 'yidak' },
  });
}

export async function createConnectOnboardingLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string,
): Promise<string> {
  const link = await stripe.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: 'account_onboarding',
  });
  return link.url;
}

export async function createConnectLoginLink(accountId: string): Promise<string> {
  const link = await stripe.accounts.createLoginLink(accountId);
  return link.url;
}
