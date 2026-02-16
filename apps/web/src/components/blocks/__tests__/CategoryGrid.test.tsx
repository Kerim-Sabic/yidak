import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Wrench, Zap } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { CategoryGrid } from '../CategoryGrid';

import { renderWithIntl } from './test-utils';

const categories = [
  {
    id: '1',
    slug: 'plumbing',
    icon: Wrench,
    subcategoryKeys: ['pipes', 'drain'],
  },
  {
    id: '2',
    slug: 'electrical',
    icon: Zap,
    subcategoryKeys: ['wiring'],
  },
] as const;

describe('CategoryGrid', () => {
  it('renders category cards and handles selection', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    renderWithIntl(
      <CategoryGrid categories={categories} selectedCategoryId="" onSelect={onSelect} />,
    );

    const [firstCard] = screen.getAllByRole('button');
    if (!firstCard) {
      throw new Error('Expected at least one category card');
    }
    await user.click(firstCard);
    expect(onSelect).toHaveBeenCalledWith('1');
  });

  it('shows subcategories for selected category', () => {
    renderWithIntl(
      <CategoryGrid categories={categories} selectedCategoryId="1" onSelect={vi.fn()} />,
    );

    expect(screen.getByText('subcategoriesLabel')).toBeInTheDocument();
    expect(screen.getByText('plumbing.subcategories.pipes')).toBeInTheDocument();
  });
});
