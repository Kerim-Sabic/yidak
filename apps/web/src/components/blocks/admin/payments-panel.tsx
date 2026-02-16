'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdminPaymentsPanelProps {
  title: string;
  subtitle: string;
}

interface TransactionRow {
  id: string;
  date: string;
  job: string;
  customer: string;
  worker: string;
  amount: number;
  fee: number;
  status: 'authorized' | 'captured' | 'refunded' | 'voided';
  country: string;
}

const transactions: ReadonlyArray<TransactionRow> = [
  {
    id: 'P-9201',
    date: '2026-02-13',
    job: 'AC service',
    customer: 'Mariam Ali',
    worker: 'Noor Haddad',
    amount: 220,
    fee: 39.6,
    status: 'captured',
    country: 'AE',
  },
  {
    id: 'P-9198',
    date: '2026-02-13',
    job: 'Leak repair',
    customer: 'Hala Yusuf',
    worker: 'Ahmed Nasser',
    amount: 180,
    fee: 32.4,
    status: 'authorized',
    country: 'SA',
  },
  {
    id: 'P-9188',
    date: '2026-02-12',
    job: 'Paint touchup',
    customer: 'Rania Saleh',
    worker: 'Saeed Al Harbi',
    amount: 140,
    fee: 25.2,
    status: 'voided',
    country: 'QA',
  },
  {
    id: 'P-9174',
    date: '2026-02-11',
    job: 'Smart lock install',
    customer: 'Alaa M.',
    worker: 'Yousef H.',
    amount: 260,
    fee: 46.8,
    status: 'refunded',
    country: 'KW',
  },
];

const monthlyRevenue = [
  { month: 'Sep', value: 44000 },
  { month: 'Oct', value: 48700 },
  { month: 'Nov', value: 51200 },
  { month: 'Dec', value: 55100 },
  { month: 'Jan', value: 57300 },
  { month: 'Feb', value: 58900 },
];

const countryBreakdown = [
  { name: 'AE', value: 38 },
  { name: 'SA', value: 26 },
  { name: 'QA', value: 14 },
  { name: 'KW', value: 12 },
  { name: 'BH', value: 6 },
  { name: 'OM', value: 4 },
];

const statusVariant = (
  status: TransactionRow['status'],
): 'default' | 'secondary' | 'destructive' => {
  if (status === 'captured') {
    return 'default';
  }

  if (status === 'authorized') {
    return 'secondary';
  }

  return 'destructive';
};

const sum = (values: ReadonlyArray<number>): number =>
  values.reduce((acc, value) => acc + value, 0);

const money = (value: number): string =>
  new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 2,
  }).format(value);

const tooltipMoney = (value: number | string | undefined): string => {
  if (typeof value === 'number') {
    return money(value);
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return money(0);
  }

  return money(parsed);
};

const tooltipPercent = (value: number | string | undefined): string => {
  if (typeof value === 'number') {
    return `${value}%`;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return '0%';
  }

  return `${parsed}%`;
};

export const AdminPaymentsPanel = ({
  title,
  subtitle,
}: AdminPaymentsPanelProps): React.JSX.Element => {
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(
    () =>
      transactions.filter((item) => {
        if (statusFilter === 'all') {
          return true;
        }

        return item.status === statusFilter;
      }),
    [statusFilter],
  );

  const totals = useMemo(() => {
    const volume = sum(filtered.map((item) => item.amount));
    const revenue = sum(filtered.map((item) => item.fee));
    const pendingEscrow = sum(
      filtered.filter((item) => item.status === 'authorized').map((item) => item.amount),
    );
    const refunds = sum(
      filtered.filter((item) => item.status === 'refunded').map((item) => item.amount),
    );

    return { volume, revenue, pendingEscrow, refunds };
  }, [filtered]);

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Total Volume</p>
            <p className="mt-1 text-xl font-semibold">{money(totals.volume)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Platform Revenue</p>
            <p className="mt-1 text-xl font-semibold">{money(totals.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Pending Escrow</p>
            <p className="mt-1 text-xl font-semibold">{money(totals.pendingEscrow)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Refunds</p>
            <p className="mt-1 text-xl font-semibold">{money(totals.refunds)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Month</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={tooltipMoney} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Country</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={countryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={88}
                  fill="hsl(var(--primary))"
                />
                <Tooltip formatter={tooltipPercent} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Transactions</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="authorized">Authorized</SelectItem>
              <SelectItem value="captured">Captured</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="voided">Voided</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-xs">
                <th className="py-2 text-start">Date</th>
                <th className="py-2 text-start">Job</th>
                <th className="py-2 text-start">Customer</th>
                <th className="py-2 text-start">Worker</th>
                <th className="py-2 text-start">Amount</th>
                <th className="py-2 text-start">Fee</th>
                <th className="py-2 text-start">Status</th>
                <th className="py-2 text-start">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.date}</td>
                  <td className="py-2">{item.job}</td>
                  <td className="py-2">{item.customer}</td>
                  <td className="py-2">{item.worker}</td>
                  <td className="py-2">{money(item.amount)}</td>
                  <td className="py-2">{money(item.fee)}</td>
                  <td className="py-2">
                    <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="py-2">
                    <Button type="button" variant="outline" size="sm">
                      Manage Refund
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
};

export default AdminPaymentsPanel;
