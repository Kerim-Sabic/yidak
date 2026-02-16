'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface AdminDisputesPanelProps {
  title: string;
  subtitle: string;
}

interface DisputeItem {
  id: string;
  jobTitle: string;
  customer: string;
  worker: string;
  reason: string;
  amount: number;
  ageHours: number;
  priority: number;
}

const disputes: ReadonlyArray<DisputeItem> = [
  {
    id: 'D-103',
    jobTitle: 'Villa plumbing fix',
    customer: 'Mariam Ali',
    worker: 'Saeed Al Harbi',
    reason: 'Incomplete work',
    amount: 420,
    ageHours: 51,
    priority: 9,
  },
  {
    id: 'D-101',
    jobTitle: 'AC replacement',
    customer: 'Faisal Omar',
    worker: 'Noor Haddad',
    reason: 'Late completion',
    amount: 260,
    ageHours: 24,
    priority: 7,
  },
  {
    id: 'D-099',
    jobTitle: 'Paint correction',
    customer: 'Rania Saleh',
    worker: 'Ahmed Nasser',
    reason: 'Damage claim',
    amount: 180,
    ageHours: 12,
    priority: 6,
  },
];

const timeline: ReadonlyArray<string> = [
  'Job posted',
  'Bid accepted',
  'Escrow authorized',
  'Work started',
  'Dispute filed',
];

const sortedDisputes = (source: ReadonlyArray<DisputeItem>): ReadonlyArray<DisputeItem> =>
  [...source].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }

    return b.ageHours - a.ageHours;
  });

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value);

export const AdminDisputesPanel = ({
  title,
  subtitle,
}: AdminDisputesPanelProps): React.JSX.Element => {
  const [selectedDisputeId, setSelectedDisputeId] = useState(disputes[0]?.id ?? '');
  const [decision, setDecision] = useState('customer');
  const [notes, setNotes] = useState('');

  const queue = useMemo(() => sortedDisputes(disputes), []);
  const active = queue.find((item) => item.id === selectedDisputeId) ?? queue[0] ?? null;

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr,1.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dispute Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {queue.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedDisputeId(item.id);
                }}
                className={`w-full rounded-xl border p-3 text-start ${selectedDisputeId === item.id ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{item.jobTitle}</p>
                  <Badge variant={item.priority > 7 ? 'destructive' : 'secondary'}>
                    P{item.priority}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {item.id} · {item.reason}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatCurrency(item.amount)} at stake · {item.ageHours}h old
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resolution Workbench</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {active ? (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="border-border rounded-xl border p-3">
                    <p className="font-medium">Parties</p>
                    <p className="text-muted-foreground mt-1">Customer: {active.customer}</p>
                    <p className="text-muted-foreground">Worker: {active.worker}</p>
                    <p className="text-muted-foreground">Reason: {active.reason}</p>
                  </div>
                  <div className="border-border rounded-xl border p-3">
                    <p className="font-medium">Evidence</p>
                    <p className="text-muted-foreground mt-1">12 chat messages</p>
                    <p className="text-muted-foreground">6 photos</p>
                    <p className="text-muted-foreground">Payment auth #auth_89211</p>
                  </div>
                </div>

                <div className="border-border rounded-xl border p-3">
                  <p className="mb-2 font-medium">Timeline</p>
                  <div className="space-y-1">
                    {timeline.map((eventName, index) => (
                      <div key={eventName} className="flex items-center gap-2 text-xs">
                        <span className="bg-muted inline-flex h-5 w-5 items-center justify-center rounded-full font-medium">
                          {index + 1}
                        </span>
                        <span>{eventName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="border-border space-y-2 rounded-xl border p-3">
                    <p className="font-medium">Customer Statement</p>
                    <p className="text-muted-foreground">
                      Worker did not complete the final leak fix and left before pressure test.
                    </p>
                  </div>
                  <div className="border-border space-y-2 rounded-xl border p-3">
                    <p className="font-medium">Worker Statement</p>
                    <p className="text-muted-foreground">
                      Extra piping was outside original scope; customer refused add-on quotation.
                    </p>
                  </div>
                </div>

                <div className="border-border space-y-3 rounded-xl border p-3">
                  <Label htmlFor="decision">Decision</Label>
                  <Select value={decision} onValueChange={setDecision}>
                    <SelectTrigger id="decision">
                      <SelectValue placeholder="Select decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Resolve in customer favor</SelectItem>
                      <SelectItem value="worker">Resolve in worker favor</SelectItem>
                      <SelectItem value="split">Split decision</SelectItem>
                      <SelectItem value="more_info">Request more information</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="space-y-1">
                    <Label htmlFor="resolutionNotes">Resolution notes</Label>
                    <Textarea
                      id="resolutionNotes"
                      value={notes}
                      onChange={(event) => {
                        setNotes(event.target.value);
                      }}
                      placeholder="Resolution notes are required"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" disabled={notes.trim().length < 10}>
                      Apply Resolution
                    </Button>
                    <Button type="button" variant="outline">
                      Notify Both Parties
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No dispute selected.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AdminDisputesPanel;
