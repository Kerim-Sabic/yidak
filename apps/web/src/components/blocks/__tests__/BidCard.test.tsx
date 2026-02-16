import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BidCard } from '../BidCard';

const labels = {
  duration: 'Duration',
  status: 'Status',
  completionRate: 'Completion Rate',
  acceptBid: 'Accept Bid',
  accepting: 'Accepting',
  withdraw: 'Withdraw',
  withdrawing: 'Withdrawing',
  showLess: 'Show less',
  readMore: 'Read more',
  lowest: 'Lowest'
} as const;

const bid = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  job_id: '550e8400-e29b-41d4-a716-446655440002',
  worker_id: '550e8400-e29b-41d4-a716-446655440003',
  amount: 150,
  currency: 'AED',
  status: 'pending',
  message: 'I can fix this quickly and professionally.',
  estimated_duration_hours: 2,
  created_at: new Date().toISOString(),
  worker: {
    id: '550e8400-e29b-41d4-a716-446655440003',
    full_name: 'Ahmed',
    avatar_url: null,
    is_verified: true,
    tier: 'gold' as const,
    average_rating: 4.8,
    completion_rate: 97,
    response_time_minutes: 9,
    total_reviews: 127,
    distance_km: 3.1
  }
};

describe('BidCard', () => {
  it('displays bid amount with currency', () => {
    render(
      <BidCard
        bid={bid}
        rank={1}
        isLowest={false}
        locale="en"
        view="customer"
        labels={labels}
      />
    );

    expect(screen.getByText(/150/)).toBeInTheDocument();
    expect(screen.getByText(/AED/)).toBeInTheDocument();
  });

  it('shows lowest badge when bid is lowest', () => {
    render(
      <BidCard
        bid={bid}
        rank={1}
        isLowest={true}
        locale="en"
        view="customer"
        labels={labels}
      />
    );

    expect(screen.getByText(/lowest/i)).toBeInTheDocument();
  });

  it('calls onAccept when accept button is clicked', async () => {
    const onAccept = vi.fn();
    const user = userEvent.setup();

    render(
      <BidCard
        bid={bid}
        rank={2}
        isLowest={false}
        locale="en"
        view="customer"
        labels={labels}
        onAccept={onAccept}
      />
    );

    await user.click(screen.getByRole('button', { name: /accept bid/i }));
    expect(onAccept).toHaveBeenCalledOnce();
  });

  it('shows worker tier badge', () => {
    render(
      <BidCard
        bid={bid}
        rank={2}
        isLowest={false}
        locale="en"
        view="customer"
        labels={labels}
      />
    );

    expect(screen.getByText(/gold/i)).toBeInTheDocument();
  });
});
