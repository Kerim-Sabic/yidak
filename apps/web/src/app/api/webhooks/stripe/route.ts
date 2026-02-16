import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const createStripeClient = (): Stripe | null => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return null;
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
  });
};

export async function POST(request: Request): Promise<NextResponse> {
  const stripeClient = createStripeClient();
  if (!stripeClient) {
    return NextResponse.json({ error: 'Missing Stripe secret key' }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripeClient.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  switch (event.type) {
    case 'payment_intent.amount_capturable_updated': {
      void event.data.object;
      break;
    }
    case 'payment_intent.succeeded': {
      void event.data.object;
      break;
    }
    case 'payment_intent.canceled': {
      void event.data.object;
      break;
    }
    case 'charge.refunded': {
      void event.data.object;
      break;
    }
    case 'account.updated': {
      void event.data.object;
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
