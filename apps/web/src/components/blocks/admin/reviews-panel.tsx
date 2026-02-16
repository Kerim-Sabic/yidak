'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdminReviewsPanelProps {
  title: string;
  subtitle: string;
}

interface ReviewRow {
  id: string;
  reviewer: string;
  reviewee: string;
  rating: number;
  category: string;
  city: string;
  flagged: boolean;
  content: string;
  createdAt: string;
}

const reviews: ReadonlyArray<ReviewRow> = [
  {
    id: 'R-1',
    reviewer: 'Mariam Ali',
    reviewee: 'Ahmed Nasser',
    rating: 5,
    category: 'Plumbing',
    city: 'Dubai',
    flagged: false,
    content: 'Very professional and quick.',
    createdAt: '2026-02-14',
  },
  {
    id: 'R-2',
    reviewer: 'Hala Yusuf',
    reviewee: 'Saeed Al Harbi',
    rating: 1,
    category: 'Electrical',
    city: 'Riyadh',
    flagged: true,
    content: 'Inappropriate language in chat and no-show.',
    createdAt: '2026-02-12',
  },
  {
    id: 'R-3',
    reviewer: 'Alaa M',
    reviewee: 'Noor Haddad',
    rating: 4,
    category: 'AC/HVAC',
    city: 'Doha',
    flagged: false,
    content: 'Solid work, arrived 20 mins late.',
    createdAt: '2026-02-10',
  },
  {
    id: 'R-4',
    reviewer: 'Rania Saleh',
    reviewee: 'Yousef H',
    rating: 2,
    category: 'Painting',
    city: 'Kuwait City',
    flagged: true,
    content: 'Poor finish quality and refund requested.',
    createdAt: '2026-02-08',
  },
];

export const AdminReviewsPanel = ({
  title,
  subtitle,
}: AdminReviewsPanelProps): React.JSX.Element => {
  const [query, setQuery] = useState('');
  const [flaggedFilter, setFlaggedFilter] = useState('all');
  const [selectedReviewId, setSelectedReviewId] = useState(reviews[0]?.id ?? '');

  const filtered = useMemo(
    () =>
      reviews.filter((item) => {
        if (
          !`${item.reviewer} ${item.reviewee} ${item.content}`
            .toLowerCase()
            .includes(query.toLowerCase())
        ) {
          return false;
        }

        if (flaggedFilter === 'flagged' && !item.flagged) {
          return false;
        }

        if (flaggedFilter === 'clean' && item.flagged) {
          return false;
        }

        return true;
      }),
    [flaggedFilter, query],
  );

  const selected = filtered.find((item) => item.id === selectedReviewId) ?? filtered[0] ?? null;

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </header>

      <Card>
        <CardHeader className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="Search reviews"
          />
          <Select value={flaggedFilter} onValueChange={setFlaggedFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="flagged">Flagged only</SelectItem>
              <SelectItem value="clean">Not flagged</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr,1fr]">
          <div className="space-y-2">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedReviewId(item.id);
                }}
                className={`w-full rounded-xl border p-3 text-start ${selectedReviewId === item.id ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">
                    {item.reviewer} ? {item.reviewee}
                  </p>
                  {item.flagged ? (
                    <Badge variant="destructive">Flagged</Badge>
                  ) : (
                    <Badge>Live</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {item.category} · {item.city} · {item.createdAt}
                </p>
                <p className="mt-1 text-sm">{item.content}</p>
              </button>
            ))}
          </div>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Moderation Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {selected ? (
                <>
                  <p>
                    <span className="font-medium">Rating:</span> {selected.rating}/5
                  </p>
                  <p>
                    <span className="font-medium">Category:</span> {selected.category}
                  </p>
                  <p>
                    <span className="font-medium">Text:</span> {selected.content}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button">Approve</Button>
                    <Button type="button" variant="outline">
                      Hide Temporarily
                    </Button>
                    <Button type="button" variant="destructive">
                      Remove
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No review selected.</p>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  );
};

export default AdminReviewsPanel;
