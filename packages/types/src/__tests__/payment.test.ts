import { describe, expect, it } from 'vitest';

import { CreatePaymentInputSchema, PaymentSchema } from '../payment';

const baseCreateInput = {
  job_id: '550e8400-e29b-41d4-a716-446655440000',
  customer_id: '660e8400-e29b-41d4-a716-446655440000',
  worker_id: '770e8400-e29b-41d4-a716-446655440000',
  amount: 150,
  currency: 'AED',
  payment_method: 'card'
} as const;

describe('CreatePaymentInputSchema', () => {
  it('accepts valid input', () => {
    const result = CreatePaymentInputSchema.safeParse(baseCreateInput);
    expect(result.success).toBe(true);
  });

  it('rejects non-positive amount', () => {
    const result = CreatePaymentInputSchema.safeParse({
      ...baseCreateInput,
      amount: -1
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid currency', () => {
    const result = CreatePaymentInputSchema.safeParse({
      ...baseCreateInput,
      currency: 'USD'
    });
    expect(result.success).toBe(false);
  });

  it('rejects payment method shorter than 2 chars', () => {
    const result = CreatePaymentInputSchema.safeParse({
      ...baseCreateInput,
      payment_method: 'c'
    });
    expect(result.success).toBe(false);
  });
});

describe('PaymentSchema', () => {
  it('accepts full payment row', () => {
    const result = PaymentSchema.safeParse({
      id: '880e8400-e29b-41d4-a716-446655440000',
      job_id: baseCreateInput.job_id,
      customer_id: baseCreateInput.customer_id,
      worker_id: baseCreateInput.worker_id,
      amount: 150,
      currency: 'AED',
      platform_fee: 27,
      worker_payout: 123,
      stripe_payment_intent_id: 'pi_test_1',
      stripe_checkout_session_id: null,
      status: 'authorized',
      payment_method: 'card',
      metadata: {},
      authorized_at: new Date().toISOString(),
      captured_at: null,
      voided_at: null,
      refunded_at: null,
      created_at: new Date().toISOString()
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative platform fee', () => {
    const result = PaymentSchema.safeParse({
      id: '880e8400-e29b-41d4-a716-446655440000',
      job_id: baseCreateInput.job_id,
      customer_id: baseCreateInput.customer_id,
      worker_id: baseCreateInput.worker_id,
      amount: 150,
      currency: 'AED',
      platform_fee: -1,
      worker_payout: 123,
      stripe_payment_intent_id: 'pi_test_1',
      stripe_checkout_session_id: null,
      status: 'authorized',
      payment_method: 'card',
      metadata: {},
      authorized_at: null,
      captured_at: null,
      voided_at: null,
      refunded_at: null,
      created_at: new Date().toISOString()
    });
    expect(result.success).toBe(false);
  });
});
