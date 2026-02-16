do $$
begin
  if exists (select 1 from pg_type where typname = 'notification_type') then
    alter type public.notification_type add value if not exists 'new_bid';
    alter type public.notification_type add value if not exists 'outbid';
    alter type public.notification_type add value if not exists 'job_posted';
    alter type public.notification_type add value if not exists 'payment_authorized';
    alter type public.notification_type add value if not exists 'payment_released';
    alter type public.notification_type add value if not exists 'auction_ending';
    alter type public.notification_type add value if not exists 'tier_upgrade';
    alter type public.notification_type add value if not exists 'referral_credit';
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'referral_reward_type') then
    create type public.referral_reward_type as enum ('cash', 'discount', 'credit');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'referral_reward_status') then
    create type public.referral_reward_status as enum ('pending', 'completed', 'credited', 'cancelled');
  end if;
end
$$;

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null unique,
  uses_count integer not null default 0,
  max_uses integer not null default 200,
  created_at timestamptz not null default now()
);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referee_id uuid not null references public.profiles(id) on delete cascade,
  code_id uuid not null references public.referral_codes(id) on delete cascade,
  reward_type public.referral_reward_type not null default 'cash',
  reward_amount double precision not null default 0,
  status public.referral_reward_status not null default 'pending',
  credited_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists referral_codes_user_created_idx
  on public.referral_codes (user_id, created_at desc);

create index if not exists referral_rewards_referrer_status_idx
  on public.referral_rewards (referrer_id, status, created_at desc);

create index if not exists referral_rewards_referee_created_idx
  on public.referral_rewards (referee_id, created_at desc);

create index if not exists referral_rewards_code_idx
  on public.referral_rewards (code_id);

alter table public.referral_codes enable row level security;
alter table public.referral_rewards enable row level security;

drop policy if exists "users can read own referral codes" on public.referral_codes;
create policy "users can read own referral codes"
  on public.referral_codes
  for select
  using (auth.uid() = (select auth_id from public.profiles where id = user_id));

drop policy if exists "users can create own referral code" on public.referral_codes;
create policy "users can create own referral code"
  on public.referral_codes
  for insert
  with check (auth.uid() = (select auth_id from public.profiles where id = user_id));

drop policy if exists "users can read referral rewards they belong to" on public.referral_rewards;
create policy "users can read referral rewards they belong to"
  on public.referral_rewards
  for select
  using (
    auth.uid() = (select auth_id from public.profiles where id = referrer_id)
    or auth.uid() = (select auth_id from public.profiles where id = referee_id)
  );
