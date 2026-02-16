export const testUsers = {
  customer: {
    phone: '+971501111111',
    email: 'customer.e2e@yidak.app',
    otp: '123456'
  },
  worker: {
    phone: '+971502222222',
    email: 'worker.e2e@yidak.app',
    otp: '123456'
  }
} as const;

export const testJobs = {
  plumbing: {
    title: 'Fix kitchen sink leak',
    budgetMin: 100,
    budgetMax: 250,
    city: 'Dubai'
  }
} as const;

export const testBids = {
  default: {
    amount: 150,
    durationHours: 2,
    message: 'I can complete this today.'
  }
} as const;
