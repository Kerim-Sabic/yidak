'use client';

import { Gift, Share2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface AdminReferralsPanelProps {
  title: string;
  subtitle: string;
}

interface ReferralRow {
  id: string;
  referrer: string;
  referee: string;
  code: string;
  reward: number;
  status: 'pending' | 'completed' | 'credited';
  createdAt: string;
}

const referralRows: ReadonlyArray<ReferralRow> = [
  {
    id: 'RF-31',
    referrer: 'Ahmed Nasser',
    referee: 'Fahad M',
    code: 'AHMED50',
    reward: 50,
    status: 'credited',
    createdAt: '2026-02-11',
  },
  {
    id: 'RF-30',
    referrer: 'Mariam Ali',
    referee: 'Rana S',
    code: 'MARIAM50',
    reward: 75,
    status: 'completed',
    createdAt: '2026-02-10',
  },
  {
    id: 'RF-29',
    referrer: 'Noor Haddad',
    referee: 'Yara D',
    code: 'NOOR75',
    reward: 50,
    status: 'pending',
    createdAt: '2026-02-09',
  },
];

const statusVariant = (status: ReferralRow['status']): 'default' | 'secondary' | 'outline' => {
  if (status === 'credited') {
    return 'default';
  }

  if (status === 'completed') {
    return 'secondary';
  }

  return 'outline';
};

const money = (value: number): string =>
  new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value);

export const AdminReferralsPanel = ({
  title,
  subtitle,
}: AdminReferralsPanelProps): React.JSX.Element => {
  const total = referralRows.length;
  const credited = referralRows.filter((item) => item.status === 'credited').length;
  const earned = referralRows.reduce((sum, item) => sum + item.reward, 0);

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Total Referrals</p>
            <p className="mt-1 text-2xl font-semibold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Successful</p>
            <p className="mt-1 text-2xl font-semibold">{credited}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Rewards Issued</p>
            <p className="mt-1 text-2xl font-semibold">{money(earned)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reward Tier Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <p>Current reward band: 6-15 referrals</p>
            <p className="font-medium">75 AED each</p>
          </div>
          <Progress value={55} />
          <p className="text-muted-foreground text-xs">
            4 more referrals needed to reach 100 AED tier.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Referral History</CardTitle>
          <Button type="button" variant="outline" size="sm">
            <Share2 className="h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {referralRows.map((item) => (
            <div
              key={item.id}
              className="border-border flex items-center justify-between rounded-xl border p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {item.referrer} ? {item.referee}
                </p>
                <p className="text-muted-foreground text-xs">
                  {item.code} · {item.createdAt}
                </p>
              </div>
              <div className="inline-flex items-center gap-2">
                <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                <span className="font-medium">{money(item.reward)}</span>
                <Gift className="h-4 w-4 text-amber-500" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
};

export default AdminReferralsPanel;
