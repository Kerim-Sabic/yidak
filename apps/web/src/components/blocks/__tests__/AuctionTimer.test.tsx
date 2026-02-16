import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuctionTimer } from '../AuctionTimer';

describe('AuctionTimer', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows expired label when time has passed', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { headers: { date: new Date().toUTCString() } })
    );

    render(<AuctionTimer expiresAt={new Date(Date.now() - 1_000).toISOString()} expiredLabel="Auction Ended" />);
    expect(screen.getByText('Auction Ended')).toBeInTheDocument();
  });

  it('calls onExpired when timer reaches zero', () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { headers: { date: new Date().toUTCString() } })
    );

    const onExpired = vi.fn();
    render(<AuctionTimer expiresAt={new Date(Date.now() + 1_500).toISOString()} onExpired={onExpired} />);

    act(() => {
      vi.advanceTimersByTime(2_500);
    });

    expect(onExpired).toHaveBeenCalled();
  });
});
