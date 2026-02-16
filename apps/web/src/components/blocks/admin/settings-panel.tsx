'use client';

import { Save } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AdminSettingsPanelProps {
  title: string;
  subtitle: string;
}

interface FeatureFlags {
  instantPayouts: boolean;
  aiModeration: boolean;
  referralBoost: boolean;
  socialLoginApple: boolean;
}

const ToggleField = ({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}): React.JSX.Element => (
  <label
    htmlFor={id}
    className="border-border flex items-center justify-between rounded-xl border p-3"
  >
    <span className="text-sm font-medium">{label}</span>
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(event) => {
        onChange(event.target.checked);
      }}
    />
  </label>
);

export const AdminSettingsPanel = ({
  title,
  subtitle,
}: AdminSettingsPanelProps): React.JSX.Element => {
  const [bronzeRate, setBronzeRate] = useState('20');
  const [silverRate, setSilverRate] = useState('18');
  const [goldRate, setGoldRate] = useState('15');
  const [platinumRate, setPlatinumRate] = useState('12');
  const [flexibleHours, setFlexibleHours] = useState('48');
  const [normalHours, setNormalHours] = useState('24');
  const [urgentHours, setUrgentHours] = useState('6');
  const [emergencyHours, setEmergencyHours] = useState('2');
  const [minBid, setMinBid] = useState('25');
  const [maxBid, setMaxBid] = useState('20000');
  const [autoVoidHours, setAutoVoidHours] = useState('168');
  const [moderationRules, setModerationRules] = useState(
    'Block hate speech, phone numbers in public job text, and payment bypass requests.',
  );
  const [flags, setFlags] = useState<FeatureFlags>({
    instantPayouts: false,
    aiModeration: true,
    referralBoost: true,
    socialLoginApple: true,
  });

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commission Rates by Tier (%)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="bronze">Bronze</Label>
              <Input
                id="bronze"
                value={bronzeRate}
                onChange={(event) => {
                  setBronzeRate(event.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="silver">Silver</Label>
              <Input
                id="silver"
                value={silverRate}
                onChange={(event) => {
                  setSilverRate(event.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gold">Gold</Label>
              <Input
                id="gold"
                value={goldRate}
                onChange={(event) => {
                  setGoldRate(event.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="platinum">Platinum</Label>
              <Input
                id="platinum"
                value={platinumRate}
                onChange={(event) => {
                  setPlatinumRate(event.target.value);
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Auction Duration Defaults (hours)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="flexible">Flexible</Label>
              <Input
                id="flexible"
                value={flexibleHours}
                onChange={(event) => {
                  setFlexibleHours(event.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="normal">Normal</Label>
              <Input
                id="normal"
                value={normalHours}
                onChange={(event) => {
                  setNormalHours(event.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="urgent">Urgent</Label>
              <Input
                id="urgent"
                value={urgentHours}
                onChange={(event) => {
                  setUrgentHours(event.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="emergency">Emergency</Label>
              <Input
                id="emergency"
                value={emergencyHours}
                onChange={(event) => {
                  setEmergencyHours(event.target.value);
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bid & Escrow Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="minBid">Minimum bid amount (AED)</Label>
              <Input
                id="minBid"
                value={minBid}
                onChange={(event) => {
                  setMinBid(event.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="maxBid">Maximum bid amount (AED)</Label>
              <Input
                id="maxBid"
                value={maxBid}
                onChange={(event) => {
                  setMaxBid(event.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="autoVoid">Auto-void timeout (hours)</Label>
              <Input
                id="autoVoid"
                value={autoVoidHours}
                onChange={(event) => {
                  setAutoVoidHours(event.target.value);
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature Flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ToggleField
              id="f1"
              label="Instant payouts"
              checked={flags.instantPayouts}
              onChange={(next) => {
                setFlags((current) => ({ ...current, instantPayouts: next }));
              }}
            />
            <ToggleField
              id="f2"
              label="AI moderation"
              checked={flags.aiModeration}
              onChange={(next) => {
                setFlags((current) => ({ ...current, aiModeration: next }));
              }}
            />
            <ToggleField
              id="f3"
              label="Referral boost campaigns"
              checked={flags.referralBoost}
              onChange={(next) => {
                setFlags((current) => ({ ...current, referralBoost: next }));
              }}
            />
            <ToggleField
              id="f4"
              label="Apple social login"
              checked={flags.socialLoginApple}
              onChange={(next) => {
                setFlags((current) => ({ ...current, socialLoginApple: next }));
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content Moderation Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={moderationRules}
            onChange={(event) => {
              setModerationRules(event.target.value);
            }}
          />
          <Button type="button">
            <Save className="h-4 w-4" />
            Save Platform Settings
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};

export default AdminSettingsPanel;
