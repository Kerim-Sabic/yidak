import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('*/auth/v1/token', () =>
    HttpResponse.json({
      access_token: 'mock-token',
      user: { id: 'user-1', email: 'test@yidak.app' }
    })
  ),

  http.get('*/rest/v1/profiles*', () =>
    HttpResponse.json([
      {
        id: 'profile-1',
        auth_id: 'user-1',
        role: 'customer',
        full_name: 'Test User',
        phone: '+971501234567',
        country: 'AE',
        city: 'Dubai'
      }
    ])
  ),

  http.post('https://api.stripe.com/v1/payment_intents', () =>
    HttpResponse.json({
      id: 'pi_test_mock',
      client_secret: 'pi_test_mock_secret_123',
      status: 'requires_payment_method',
      amount: 15000,
      currency: 'aed',
    })
  ),

  http.post('https://api.stripe.com/v1/payment_intents/:id/capture', () =>
    HttpResponse.json({ id: 'pi_test_mock', status: 'succeeded' })
  ),

  http.post('https://api.stripe.com/v1/payment_intents/:id/cancel', () =>
    HttpResponse.json({ id: 'pi_test_mock', status: 'canceled' })
  ),

  http.post('https://api.stripe.com/v1/customers', () =>
    HttpResponse.json({ id: 'cus_test_mock', name: 'Test User' })
  ),
];
