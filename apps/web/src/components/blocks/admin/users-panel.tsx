'use client';

import { Download, IdCard, ShieldCheck, UserRoundX } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface AdminUsersPanelProps {
  title: string;
  subtitle: string;
}

type Role = 'customer' | 'worker' | 'admin';
type Status = 'active' | 'suspended' | 'banned';
type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';

interface UserRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: Role;
  city: string;
  country: string;
  tier: Tier;
  verified: boolean;
  status: Status;
  joined: string;
}

interface TimelineItem {
  id: string;
  text: string;
  when: string;
}

const rows: ReadonlyArray<UserRow> = [
  {
    id: 'u-1',
    name: 'Ahmed Nasser',
    phone: '+971501234567',
    email: 'ahmed@yidak.app',
    role: 'worker',
    city: 'Dubai',
    country: 'AE',
    tier: 'gold',
    verified: true,
    status: 'active',
    joined: '2025-05-11',
  },
  {
    id: 'u-2',
    name: 'Mariam Ali',
    phone: '+966551234567',
    email: 'mariam@yidak.app',
    role: 'customer',
    city: 'Riyadh',
    country: 'SA',
    tier: 'bronze',
    verified: true,
    status: 'active',
    joined: '2025-07-24',
  },
  {
    id: 'u-3',
    name: 'Saeed Al Harbi',
    phone: '+97433123456',
    email: 'saeed@yidak.app',
    role: 'worker',
    city: 'Doha',
    country: 'QA',
    tier: 'silver',
    verified: false,
    status: 'suspended',
    joined: '2025-04-03',
  },
  {
    id: 'u-4',
    name: 'Hala Yusuf',
    phone: '+96555123456',
    email: 'hala@yidak.app',
    role: 'customer',
    city: 'Kuwait City',
    country: 'KW',
    tier: 'bronze',
    verified: true,
    status: 'active',
    joined: '2025-08-15',
  },
  {
    id: 'u-5',
    name: 'Noor Haddad',
    phone: '+97336123456',
    email: 'noor@yidak.app',
    role: 'worker',
    city: 'Manama',
    country: 'BH',
    tier: 'platinum',
    verified: true,
    status: 'active',
    joined: '2025-01-20',
  },
];

const activityTimeline: ReadonlyArray<TimelineItem> = [
  { id: 't1', text: 'Completed job #J-1234', when: '2h ago' },
  { id: 't2', text: 'Received 5-star review', when: '1d ago' },
  { id: 't3', text: 'Escrow payment released', when: '3d ago' },
  { id: 't4', text: 'Uploaded KYC documents', when: '5d ago' },
];

const statusVariant = (value: Status): 'default' | 'destructive' | 'secondary' => {
  if (value === 'banned') {
    return 'destructive';
  }

  if (value === 'suspended') {
    return 'secondary';
  }

  return 'default';
};

export const AdminUsersPanel = ({ title, subtitle }: AdminUsersPanelProps): React.JSX.Element => {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [country, setCountry] = useState('all');
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [activeUserId, setActiveUserId] = useState(rows[0]?.id ?? '');
  const [actionDialog, setActionDialog] = useState<'verify' | 'suspend' | 'ban' | null>(null);
  const [actionReason, setActionReason] = useState('');

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const query = `${row.name} ${row.phone} ${row.email}`.toLowerCase();
      if (!query.includes(search.trim().toLowerCase())) {
        return false;
      }

      if (role !== 'all' && row.role !== role) {
        return false;
      }

      if (status !== 'all' && row.status !== status) {
        return false;
      }

      if (country !== 'all' && row.country !== country) {
        return false;
      }

      return true;
    });
  }, [country, role, search, status]);

  const activeUser = filtered.find((row) => row.id === activeUserId) ?? filtered[0] ?? null;

  const toggleSelected = (id: string): void => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </header>

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-4">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="Search by name, phone, or email"
          />
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="worker">Worker</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              <SelectItem value="AE">UAE</SelectItem>
              <SelectItem value="SA">KSA</SelectItem>
              <SelectItem value="QA">Qatar</SelectItem>
              <SelectItem value="BH">Bahrain</SelectItem>
              <SelectItem value="KW">Kuwait</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">Users</CardTitle>
            <div className="inline-flex gap-2">
              <Button type="button" size="sm" variant="outline">
                <ShieldCheck className="h-4 w-4" /> Verify
              </Button>
              <Button type="button" size="sm" variant="outline">
                <UserRoundX className="h-4 w-4" /> Suspend
              </Button>
              <Button type="button" size="sm" variant="outline">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-xs">
                  <th className="py-2 text-start">Select</th>
                  <th className="py-2 text-start">Name</th>
                  <th className="py-2 text-start">Role</th>
                  <th className="py-2 text-start">Phone</th>
                  <th className="py-2 text-start">City</th>
                  <th className="py-2 text-start">Status</th>
                  <th className="py-2 text-start">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-muted/40 cursor-pointer border-b"
                    onClick={() => {
                      setActiveUserId(row.id);
                    }}
                  >
                    <td className="py-2">
                      <input
                        type="checkbox"
                        aria-label={`Select ${row.name}`}
                        checked={selected.has(row.id)}
                        onChange={() => {
                          toggleSelected(row.id);
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                      />
                    </td>
                    <td className="py-2 font-medium">{row.name}</td>
                    <td className="py-2 capitalize">{row.role}</td>
                    <td className="py-2">{row.phone}</td>
                    <td className="py-2">{row.city}</td>
                    <td className="py-2">
                      <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                    </td>
                    <td className="py-2">{row.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeUser ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{activeUser.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{activeUser.name}</p>
                    <p className="text-muted-foreground text-xs">{activeUser.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input id="fullName" defaultValue={activeUser.name} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" defaultValue={activeUser.city} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActionDialog('verify');
                    }}
                  >
                    Verify
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActionDialog('suspend');
                    }}
                  >
                    Suspend
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setActionDialog('ban');
                    }}
                  >
                    Ban
                  </Button>
                </div>

                <Button type="button" className="w-full" variant="secondary">
                  <IdCard className="h-4 w-4" />
                  Impersonate User
                </Button>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Activity timeline</p>
                  {activityTimeline.map((item) => (
                    <div key={item.id} className="border-border rounded-lg border p-2 text-sm">
                      <p>{item.text}</p>
                      <p className="text-muted-foreground text-xs">{item.when}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No user selected.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={actionDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm action</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={actionReason}
              onChange={(event) => {
                setActionReason(event.target.value);
              }}
              placeholder="Add an admin note"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setActionDialog(null);
                setActionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setActionDialog(null);
                setActionReason('');
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AdminUsersPanel;
