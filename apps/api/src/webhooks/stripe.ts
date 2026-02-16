import { Hono } from 'hono';

import { stripe } from '../services/stripe';

import type Stripe from 'stripe';

const stripeWebhook = new Hono();

stripeWebhook.post('/stripe', async (c) => {
  const body = await c.req.text();
  const sig = c.req.header('stripe-signature');
  if (!sig) {
    return c.json({ error: 'Missing signature' }, 400);
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return c.json({ error: 'Missing webhook secret' }, 500);
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return c.json({ error: 'Invalid signature' }, 401);
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

  return c.json({ received: true });
});

export { stripeWebhook };
