create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role text;
  user_id uuid;
begin
  claims := event->'claims';
  user_id := (claims->>'sub')::uuid;

  select role::text
    into user_role
    from public.profiles
   where auth_id = user_id
   limit 1;

  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    claims := jsonb_set(claims, '{user_metadata,role}', to_jsonb(user_role), true);
  else
    claims := jsonb_set(claims, '{user_role}', '"customer"');
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant all on table public.profiles to supabase_auth_admin;
revoke all on table public.profiles from authenticated, anon;
grant select on table public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_role public.user_role;
  safe_country public.country_code;
begin
  safe_role := case
    when coalesce(new.raw_user_meta_data->>'role', '') in ('customer', 'worker', 'admin')
      then (new.raw_user_meta_data->>'role')::public.user_role
    else 'customer'::public.user_role
  end;

  safe_country := case
    when coalesce(new.raw_user_meta_data->>'country', '') in ('AE', 'SA', 'QA', 'BH', 'KW', 'OM')
      then (new.raw_user_meta_data->>'country')::public.country_code
    else 'AE'::public.country_code
  end;

  insert into public.profiles (auth_id, full_name, phone, email, role, country, city)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.phone, ''),
    new.email,
    safe_role,
    safe_country,
    coalesce(new.raw_user_meta_data->>'city', '')
  )
  on conflict (auth_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = auth_id);

drop policy if exists profiles_select_workers_for_job_customers on public.profiles;
create policy profiles_select_workers_for_job_customers
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles me
      where me.auth_id = auth.uid()
        and me.role = 'worker'
        and exists (
          select 1
          from public.jobs j
          where j.customer_id = profiles.id
            and (
              j.assigned_worker_id = me.id
              or exists (
                select 1
                from public.bids b
                where b.job_id = j.id
                  and b.worker_id = me.id
              )
            )
        )
    )
  );

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = auth_id)
  with check (auth.uid() = auth_id);
