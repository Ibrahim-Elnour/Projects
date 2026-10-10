create extension if not exists pgcrypto;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('Theft', 'Robbery', 'Safety', 'Other')),
  description text not null,
  location_name text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  status text not null default 'active' check (status in ('active', 'resolved')),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null
);

create index reports_created_at_idx on public.reports (created_at desc);
create index reports_user_id_idx on public.reports (user_id);

alter table public.reports enable row level security;

revoke all on table public.reports from anon, authenticated;
grant select, insert on table public.reports to authenticated;
grant update (status) on table public.reports to authenticated;

create policy "Authenticated users can read reports"
on public.reports for select
to authenticated
using (true);

create policy "Users can create reports as themselves"
on public.reports for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Creators can resolve their active reports"
on public.reports for update
to authenticated
using (auth.uid() = user_id and status = 'active')
with check (auth.uid() = user_id and status = 'resolved');
