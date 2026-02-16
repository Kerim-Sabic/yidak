import { render, screen } from '@testing-library/react';
import { Wrench } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { JobCard } from '../JobCard';

const labels = {
  bids: 'bids',
  lowestBid: 'Lowest bid',
  posted: 'Posted',
  timeRemaining: 'Time remaining',
  expired: 'Expired'
} as const;

describe('JobCard', () => {
  it('renders job summary values', () => {
    render(
      <JobCard
        href="/en/customer/jobs/1"
        locale="en"
        title="Fix AC unit"
        status="posted"
        budgetLabel="AED 100 - AED 300"
        bidCount={4}
        lowestBidLabel="AED 150"
        createdAt={new Date().toISOString()}
        expiresAt={null}
        categoryName="AC Repair"
        categoryIcon={Wrench}
        labels={labels}
        country="AE"
      />
    );

    expect(screen.getByText('Fix AC unit')).toBeInTheDocument();
    expect(screen.getByText('AED 100 - AED 300')).toBeInTheDocument();
    expect(screen.getByText(/Lowest bid/i)).toBeInTheDocument();
    expect(screen.getByText(/4 bids/i)).toBeInTheDocument();
  });
});
