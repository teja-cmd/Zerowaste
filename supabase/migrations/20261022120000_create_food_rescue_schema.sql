create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  organization text,
  role text not null default 'donor' check (role in ('donor', 'receiver', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.profiles (id, email, name, role)
select
  id,
  email,
  nullif(raw_user_meta_data ->> 'name', ''),
  case when raw_user_meta_data ->> 'role' = 'receiver' then 'receiver' else 'donor' end
from auth.users
on conflict (id) do nothing;

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  food_type text not null check (food_type in ('veg', 'non_veg')),
  quantity text not null check (length(trim(quantity)) > 0),
  latitude double precision not null check (latitude between 6.4 and 37.6),
  longitude double precision not null check (longitude between 68.1 and 97.5),
  address text,
  expiry_time timestamptz not null,
  pickup_window text,
  image_url text,
  status text not null default 'fresh' check (status in ('fresh', 'expiring_soon', 'expired', 'claimed', 'picked_up')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists donations_expiry_time_idx on public.donations (expiry_time);
create index if not exists donations_donor_id_created_at_idx on public.donations (donor_id, created_at desc);

create table if not exists public.pickup_requests (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (donation_id, requester_id)
);

create index if not exists pickup_requests_requester_id_created_at_idx on public.pickup_requests (requester_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'name', ''),
    case when new.raw_user_meta_data ->> 'role' = 'receiver' then 'receiver' else 'donor' end
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(public.profiles.name, excluded.name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.donations enable row level security;
alter table public.pickup_requests enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

drop policy if exists "Anyone can view active donations" on public.donations;
create policy "Anyone can view active donations"
  on public.donations for select to anon, authenticated
  using (expiry_time > now() and status in ('fresh', 'expiring_soon'));

drop policy if exists "Donors can view their own donations" on public.donations;
create policy "Donors can view their own donations"
  on public.donations for select to authenticated
  using (donor_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Donors can insert their own donations" on public.donations;
create policy "Donors can insert their own donations"
  on public.donations for insert to authenticated
  with check (donor_id = (select auth.uid()));

drop policy if exists "Donors can update their own donations" on public.donations;
create policy "Donors can update their own donations"
  on public.donations for update to authenticated
  using (donor_id = (select auth.uid()) or public.is_admin())
  with check (donor_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Donors can delete their own donations" on public.donations;
create policy "Donors can delete their own donations"
  on public.donations for delete to authenticated
  using (donor_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Users can view related pickup requests" on public.pickup_requests;
create policy "Users can view related pickup requests"
  on public.pickup_requests for select to authenticated
  using (
    requester_id = (select auth.uid())
    or exists (
      select 1 from public.donations
      where donations.id = pickup_requests.donation_id
        and donations.donor_id = (select auth.uid())
    )
    or public.is_admin()
  );

drop policy if exists "Receivers can request active donations" on public.pickup_requests;
create policy "Receivers can request active donations"
  on public.pickup_requests for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'receiver'
    )
    and exists (
      select 1 from public.donations
      where donations.id = pickup_requests.donation_id
        and donations.donor_id <> (select auth.uid())
        and donations.expiry_time > now()
        and donations.status in ('fresh', 'expiring_soon')
    )
  );

grant select on public.profiles to authenticated;
grant select on public.donations to anon, authenticated;
grant insert, update, delete on public.donations to authenticated;
grant select, insert on public.pickup_requests to authenticated;

insert into storage.buckets (id, name, public)
values ('donation-images', 'donation-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can view donation images" on storage.objects;
create policy "Public can view donation images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'donation-images');

drop policy if exists "Donors can upload their own donation images" on storage.objects;
create policy "Donors can upload their own donation images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'donation-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Donors can delete their own donation images" on storage.objects;
create policy "Donors can delete their own donation images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'donation-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );