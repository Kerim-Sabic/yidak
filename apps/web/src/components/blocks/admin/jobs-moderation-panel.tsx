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

interface AdminJobsPanelProps {
  title: string;
  subtitle: string;
}

type JobStatus = 'posted' | 'bidding' | 'assigned' | 'completed' | 'cancelled';

interface ModerationJob {
  id: string;
  title: string;
  category: string;
  city: string;
  reporterReason: string;
  status: JobStatus;
  risk: 'high' | 'medium' | 'low';
}

const moderationQueue: ReadonlyArray<ModerationJob> = [
  {
    id: 'J-2210',
    title: 'Electrical rewiring in villa',
    category: 'Electrical',
    city: 'Dubai',
    reporterReason: 'Unsafe wording in description',
    status: 'posted',
    risk: 'high',
  },
  {
    id: 'J-2204',
    title: 'Apartment deep cleaning',
    category: 'Cleaning',
    city: 'Doha',
    reporterReason: 'Duplicate listing from suspended account',
    status: 'bidding',
    risk: 'medium',
  },
  {
    id: 'J-2198',
    title: 'Pipe leak emergency',
    category: 'Plumbing',
    city: 'Riyadh',
    reporterReason: 'Potential scam pricing',
    status: 'posted',
    risk: 'medium',
  },
];

const allJobs: ReadonlyArray<ModerationJob> = [
  ...moderationQueue,
  {
    id: 'J-2191',
    title: 'AC compressor replacement',
    category: 'AC/HVAC',
    city: 'Abu Dhabi',
    reporterReason: '',
    status: 'assigned',
    risk: 'low',
  },
  {
    id: 'J-2185',
    title: 'Smart lock installation',
    category: 'Smart Home',
    city: 'Kuwait City',
    reporterReason: '',
    status: 'completed',
    risk: 'low',
  },
  {
    id: 'J-2170',
    title: 'Wall repainting',
    category: 'Painting',
    city: 'Manama',
    reporterReason: '',
    status: 'cancelled',
    risk: 'low',
  },
];

const riskVariant = (risk: 'high' | 'medium' | 'low'): 'destructive' | 'secondary' | 'default' => {
  if (risk === 'high') {
    return 'destructive';
  }

  if (risk === 'medium') {
    return 'secondary';
  }

  return 'default';
};

export const AdminJobsModerationPanel = ({
  title,
  subtitle,
}: AdminJobsPanelProps): React.JSX.Element => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [city, setCity] = useState('all');
  const [activeJobId, setActiveJobId] = useState(moderationQueue[0]?.id ?? '');

  const filtered = useMemo(() => {
    return allJobs.filter((job) => {
      if (!`${job.id} ${job.title}`.toLowerCase().includes(query.trim().toLowerCase())) {
        return false;
      }

      if (status !== 'all' && job.status !== status) {
        return false;
      }

      if (city !== 'all' && job.city !== city) {
        return false;
      }

      return true;
    });
  }, [city, query, status]);

  const activeJob = filtered.find((job) => job.id === activeJobId) ?? filtered[0] ?? null;

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Moderation Queue</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {moderationQueue.map((item) => (
            <article key={item.id} className="border-border bg-muted/20 rounded-xl border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{item.title}</p>
                <Badge variant={riskVariant(item.risk)}>{item.risk}</Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {item.id} · {item.city}
              </p>
              <p className="mt-2 text-sm">{item.reporterReason}</p>
              <div className="mt-3 flex gap-2">
                <Button type="button" size="sm">
                  Approve
                </Button>
                <Button type="button" size="sm" variant="outline">
                  Warn Poster
                </Button>
                <Button type="button" size="sm" variant="destructive">
                  Remove
                </Button>
              </div>
            </article>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-base">All Jobs</CardTitle>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              placeholder="Search jobs"
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="posted">Posted</SelectItem>
                <SelectItem value="bidding">Bidding</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                <SelectItem value="Dubai">Dubai</SelectItem>
                <SelectItem value="Riyadh">Riyadh</SelectItem>
                <SelectItem value="Doha">Doha</SelectItem>
                <SelectItem value="Kuwait City">Kuwait City</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-[1.8fr,1fr]">
          <div className="border-border overflow-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted/20 text-muted-foreground border-b text-xs">
                  <th className="py-2 ps-3 text-start">ID</th>
                  <th className="py-2 text-start">Title</th>
                  <th className="py-2 text-start">Category</th>
                  <th className="py-2 text-start">City</th>
                  <th className="py-2 pe-3 text-start">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-muted/30 cursor-pointer border-b"
                    onClick={() => {
                      setActiveJobId(job.id);
                    }}
                  >
                    <td className="py-2 ps-3">{job.id}</td>
                    <td className="py-2">{job.title}</td>
                    <td className="py-2">{job.category}</td>
                    <td className="py-2">{job.city}</td>
                    <td className="py-2 pe-3 capitalize">{job.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Job Detail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {activeJob ? (
                <>
                  <p>
                    <span className="font-medium">Job:</span> {activeJob.title}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span> {activeJob.status}
                  </p>
                  <p>
                    <span className="font-medium">City:</span> {activeJob.city}
                  </p>
                  <p>
                    <span className="font-medium">Bids:</span> 12 total · lowest AED 145
                  </p>
                  <p>
                    <span className="font-medium">Payment:</span> Authorized escrow
                  </p>
                  <p>
                    <span className="font-medium">Chat:</span> 43 messages
                  </p>
                  <p>
                    <span className="font-medium">Reviews:</span> Pending completion
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">No job selected.</p>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  );
};

export default AdminJobsModerationPanel;
