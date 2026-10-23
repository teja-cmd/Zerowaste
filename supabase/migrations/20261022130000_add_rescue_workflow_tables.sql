alter table public.profiles
  add column if not exists verification_status text not null default 'unverified'
  check (verification_status in ('unverified', 'pending', 'verified', 'rejected'));

create table if not exists public.organization_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  organization_name text not null check (length(trim(organization_name)) > 0),
  registration_number text,
  document_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_id uuid references public.profiles (id) on delete set null,
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.donation_status_events (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  previous_status text,
  new_status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists donation_status_events_donation_created_idx
  on public.donation_status_events (donation_id, created_at desc);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  pickup_request_id uuid not null unique references public.pickup_requests (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_user_id uuid references public.profiles (id) on delete set null,
  donation_id uuid references public.donations (id) on delete set null,
  reason text not null check (length(trim(reason)) > 0),
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  resolution_notes text,
  resolved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reported_user_id is not null or donation_id is not null)
);

create index if not exists user_reports_status_created_idx
  on public.user_reports (status, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.pickup_requests enable row level security;
alter table public.organization_verifications enable row level security;
alter table public.donation_status_events enable row level security;
alter table public.feedback enable row level security;
alter table public.user_reports enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Public can view recent active or expired donations" on public.donations;
create policy "Public can view recent active or expired donations"
  on public.donations for select to anon, authenticated
  using (
    expiry_time > now() and status in ('fresh', 'expiring_soon')
    or (expiry_time <= now() and expiry_time > now() - interval '24 hours')
  );

drop policy if exists "Receivers can update their pending pickup requests" on public.pickup_requests;
create policy "Receivers can update their pending pickup requests"
  on public.pickup_requests for update to authenticated
  using (requester_id = (select auth.uid()) and status = 'pending')
  with check (requester_id = (select auth.uid()) and status = 'cancelled');

drop policy if exists "Donors can manage incoming pickup requests" on public.pickup_requests;
create policy "Donors can manage incoming pickup requests"
  on public.pickup_requests for update to authenticated
  using (
    status in ('pending', 'accepted')
    and exists (
      select 1 from public.donations
      where donations.id = pickup_requests.donation_id
        and donations.donor_id = (select auth.uid())
    )
  )
  with check (
    status in ('accepted', 'declined', 'completed')
    and exists (
      select 1 from public.donations
      where donations.id = pickup_requests.donation_id
        and donations.donor_id = (select auth.uid())
    )
  );

drop policy if exists "Users can read related donation history" on public.donation_status_events;
create policy "Users can read related donation history"
  on public.donation_status_events for select to authenticated
  using (
    exists (
      select 1 from public.donations
      where donations.id = donation_status_events.donation_id
        and donations.donor_id = (select auth.uid())
    )
    or exists (
      select 1 from public.pickup_requests
      where pickup_requests.donation_id = donation_status_events.donation_id
        and pickup_requests.requester_id = (select auth.uid())
    )
    or public.is_admin()
  );

drop policy if exists "Users can read their verification requests" on public.organization_verifications;
create policy "Users can read their verification requests"
  on public.organization_verifications for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Users can submit their verification request" on public.organization_verifications;
create policy "Users can submit their verification request"
  on public.organization_verifications for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and reviewer_id is null);

drop policy if exists "Admins can review verification requests" on public.organization_verifications;
create policy "Admins can review verification requests"
  on public.organization_verifications for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users can resubmit rejected verification requests" on public.organization_verifications;
create policy "Users can resubmit rejected verification requests"
  on public.organization_verifications for update to authenticated
  using (user_id = (select auth.uid()) and status = 'rejected')
  with check (user_id = (select auth.uid()) and status = 'pending' and reviewer_id is null);

drop policy if exists "Participants can read feedback" on public.feedback;
create policy "Participants can read feedback"
  on public.feedback for select to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1
      from public.pickup_requests
      join public.donations on donations.id = pickup_requests.donation_id
      where pickup_requests.id = feedback.pickup_request_id
        and donations.donor_id = (select auth.uid())
    )
    or public.is_admin()
  );

drop policy if exists "Receivers can leave feedback for completed pickups" on public.feedback;
create policy "Receivers can leave feedback for completed pickups"
  on public.feedback for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.pickup_requests
      where pickup_requests.id = feedback.pickup_request_id
        and pickup_requests.requester_id = (select auth.uid())
        and pickup_requests.status = 'completed'
    )
  );

drop policy if exists "Users can submit reports" on public.user_reports;
create policy "Users can submit reports"
  on public.user_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));

drop policy if exists "Users can view their own reports" on public.user_reports;
create policy "Users can view their own reports"
  on public.user_reports for select to authenticated
  using (reporter_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Admins can review reports" on public.user_reports;
create policy "Admins can review reports"
  on public.user_reports for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users can read their notifications" on public.notifications;
create policy "Users can read their notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can mark their notifications read" on public.notifications;
create policy "Users can mark their notifications read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.pickup_requests to authenticated;
grant select, insert, update on public.organization_verifications to authenticated;
grant select on public.donation_status_events to authenticated;
grant select, insert on public.feedback to authenticated;
grant select, insert, update on public.user_reports to authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

revoke update on public.pickup_requests from authenticated;
grant update (status) on public.pickup_requests to authenticated;

create or replace function public.record_donation_status_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.donation_status_events (donation_id, actor_id, new_status)
    values (new.id, new.donor_id, new.status);
  elsif old.status is distinct from new.status then
    insert into public.donation_status_events (donation_id, actor_id, previous_status, new_status)
    values (new.id, auth.uid(), old.status, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists donation_status_event_trigger on public.donations;
create trigger donation_status_event_trigger
  after insert or update of status on public.donations
  for each row execute procedure public.record_donation_status_event();

create or replace function public.notify_pickup_request_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  donation_owner uuid;
begin
  select donor_id into donation_owner
  from public.donations
  where id = new.donation_id;

  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, notification_type, title, body, data)
    values (
      donation_owner,
      'pickup_requested',
      'New pickup request',
      'Someone requested one of your food donations.',
      jsonb_build_object('donation_id', new.donation_id, 'request_id', new.id)
    );
  elsif old.status is distinct from new.status then
    if new.status = 'cancelled' then
      insert into public.notifications (user_id, notification_type, title, body, data)
      values (
        donation_owner,
        'pickup_cancelled',
        'Pickup request cancelled',
        'A receiver cancelled a pickup request.',
        jsonb_build_object('donation_id', new.donation_id, 'request_id', new.id)
      );
    else
      insert into public.notifications (user_id, notification_type, title, body, data)
      values (
        new.requester_id,
        'pickup_status_changed',
        'Pickup request updated',
        'The donor updated your pickup request.',
        jsonb_build_object('donation_id', new.donation_id, 'request_id', new.id, 'status', new.status)
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists pickup_request_notification_trigger on public.pickup_requests;
create trigger pickup_request_notification_trigger
  after insert or update of status on public.pickup_requests
  for each row execute procedure public.notify_pickup_request_changes();

create or replace function public.sync_profile_verification_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set verification_status = case new.status
        when 'approved' then 'verified'
        when 'rejected' then 'rejected'
        else 'pending'
      end,
      updated_at = now()
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists sync_profile_verification_status_trigger on public.organization_verifications;
create trigger sync_profile_verification_status_trigger
  after insert or update of status on public.organization_verifications
  for each row execute procedure public.sync_profile_verification_status();

insert into storage.buckets (id, name, public)
values ('verification-documents', 'verification-documents', false)
on conflict (id) do nothing;

drop policy if exists "Users can view own verification documents" on storage.objects;
create policy "Users can view own verification documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'verification-documents'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );

drop policy if exists "Users can upload own verification documents" on storage.objects;
create policy "Users can upload own verification documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'verification-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can replace own verification documents" on storage.objects;
create policy "Users can replace own verification documents"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'verification-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'verification-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );