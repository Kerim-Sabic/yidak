'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  CreditCard,
  Gavel,
  ShieldCheck,
  Star,
  UsersRound,
  Wrench,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { ComponentType } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DashboardKpi {
  id: string;
  label: string;
  value: number;
  change: number;
  icon: ComponentType<{ className?: string }>;
  sparkline: ReadonlyArray<number>;
}

interface DashboardOverviewProps {
  locale: 'en' | 'ar';
  title: string;
  subtitle: string;
}

interface TrendPoint {
  month: string;
  revenue: number;
  customers: number;
  workers: number;
  plumbing: number;
  electrical: number;
  ac: number;
}

interface ActivityItem {
  id: string;
  title: string;
  time: string;
}

interface AlertItem {
  id: string;
  title: string;
  count: number;
}

const trendData: ReadonlyArray<TrendPoint> = [
  {
    month: 'Mar',
    revenue: 42000,
    customers: 1300,
    workers: 410,
    plumbing: 210,
    electrical: 140,
    ac: 120,
  },
  {
    month: 'Apr',
    revenue: 46200,
    customers: 1510,
    workers: 455,
    plumbing: 230,
    electrical: 160,
    ac: 130,
  },
  {
    month: 'May',
    revenue: 48900,
    customers: 1730,
    workers: 500,
    plumbing: 270,
    electrical: 180,
    ac: 140,
  },
  {
    month: 'Jun',
    revenue: 51400,
    customers: 1980,
    workers: 560,
    plumbing: 320,
    electrical: 210,
    ac: 170,
  },
  {
    month: 'Jul',
    revenue: 53700,
    customers: 2260,
    workers: 610,
    plumbing: 360,
    electrical: 240,
    ac: 190,
  },
  {
    month: 'Aug',
    revenue: 58600,
    customers: 2520,
    workers: 672,
    plumbing: 420,
    electrical: 280,
    ac: 220,
  },
];

const activity: ReadonlyArray<ActivityItem> = [
  { id: 'a1', title: 'New worker signup in Riyadh', time: '2m ago' },
  { id: 'a2', title: 'Escrow captured for AC repair #J-1182', time: '7m ago' },
  { id: 'a3', title: 'Dispute filed for plumbing job #J-1175', time: '19m ago' },
  { id: 'a4', title: 'KYC approved for 4 workers', time: '31m ago' },
  { id: 'a5', title: 'Flagged review queued for moderation', time: '42m ago' },
];

const alerts: ReadonlyArray<AlertItem> = [
  { id: 'al1', title: 'Pending KYC verifications', count: 14 },
  { id: 'al2', title: 'Flagged content reports', count: 6 },
  { id: 'al3', title: 'Escrow holds expiring in 24h', count: 9 },
];

const geography = [
  { city: 'Dubai', jobs: 312 },
  { city: 'Riyadh', jobs: 295 },
  { city: 'Doha', jobs: 164 },
  { city: 'Kuwait City', jobs: 123 },
  { city: 'Muscat', jobs: 94 },
];

const formatNumber = (value: number, locale: 'en' | 'ar'): string =>
  new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en').format(value);

const formatMoney = (value: number, locale: 'en' | 'ar'): string =>
  new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value);

export const AdminDashboardOverview = ({
  locale,
  title,
  subtitle,
}: DashboardOverviewProps): React.JSX.Element => {
  const reducedMotion = useReducedMotion() ?? false;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 12000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const kpis = useMemo((): ReadonlyArray<DashboardKpi> => {
    const shift = (tick % 3) - 1;
    return [
      {
        id: 'users',
        label: 'Total Users',
        value: 18240 + shift * 38,
        change: 9.2,
        icon: UsersRound,
        sparkline: [12, 14, 15, 16, 18, 19],
      },
      {
        id: 'jobs',
        label: 'Active Jobs',
        value: 734 + shift * 7,
        change: 4.4,
        icon: Wrench,
        sparkline: [8, 8, 9, 11, 11, 12],
      },
      {
        id: 'revenue',
        label: 'Revenue This Month',
        value: 586000 + shift * 2400,
        change: 12.1,
        icon: CreditCard,
        sparkline: [30, 34, 36, 40, 45, 48],
      },
      {
        id: 'kyc',
        label: 'Pending KYC',
        value: 14 + shift,
        change: -6.3,
        icon: ShieldCheck,
        sparkline: [9, 8, 8, 7, 7, 6],
      },
      {
        id: 'disputes',
        label: 'Open Disputes',
        value: 23 + shift,
        change: 3.1,
        icon: Gavel,
        sparkline: [3, 3, 4, 4, 5, 5],
      },
      {
        id: 'rating',
        label: 'Average Rating',
        value: 48,
        change: 1.4,
        icon: Star,
        sparkline: [43, 44, 45, 46, 47, 48],
      },
    ];
  }, [tick]);

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map((item) => (
          <motion.article
            key={item.id}
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            className="border-border bg-card rounded-2xl border p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-muted-foreground text-xs">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold">
                  {item.id === 'revenue'
                    ? formatMoney(item.value, locale)
                    : formatNumber(item.value, locale)}
                </p>
              </div>
              <span className="bg-primary/10 text-primary inline-flex h-9 w-9 items-center justify-center rounded-xl">
                <item.icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p
                className={`text-xs font-medium ${item.change >= 0 ? 'text-emerald-600' : 'text-destructive'}`}
              >
                {item.change >= 0 ? '+' : ''}
                {item.change}%
              </p>
              <div className="h-10 w-28">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={item.sparkline.map((value, index) => ({ index, value }))}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="currentColor"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill="url(#revFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jobs by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} layout="vertical" margin={{ top: 4, bottom: 4, left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="month" width={42} />
                <Tooltip />
                <Bar dataKey="plumbing" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="customers"
                  stackId="1"
                  fill="hsl(var(--primary))"
                  stroke="hsl(var(--primary))"
                />
                <Area
                  type="monotone"
                  dataKey="workers"
                  stackId="1"
                  fill="hsl(var(--secondary))"
                  stroke="hsl(var(--secondary))"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geographic Heatmap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {geography.map((entry) => (
              <div
                key={entry.city}
                className="bg-muted/50 flex items-center justify-between rounded-lg p-2 text-sm"
              >
                <span>{entry.city}</span>
                <span className="font-medium">{formatNumber(entry.jobs, locale)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-56">
              <div className="space-y-2 pe-2">
                {activity.map((item) => (
                  <div key={item.id} className="border-border rounded-xl border p-3">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{item.time}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-amber-300/40 bg-amber-500/10 p-3"
              >
                <div className="inline-flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-medium">{item.title}</p>
                </div>
                <span className="rounded-md bg-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-700">
                  {item.count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AdminDashboardOverview;
