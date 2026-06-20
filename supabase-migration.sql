-- Create restaurant_audits table
create table if not exists restaurant_audits (
  id uuid default gen_random_uuid() primary key,
  email text,
  restaurant_name text not null,
  location text not null,
  domain text,
  audit_scores jsonb,
  total_score integer,
  audit_details jsonb,
  created_at timestamp default now(),
  ip_address text
);

-- Create email_signups table
create table if not exists email_signups (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  created_at timestamp default now(),
  ghl_contact_id text,
  synced_to_ghl boolean default false
);

-- Enable RLS
alter table restaurant_audits enable row level security;
alter table email_signups enable row level security;

-- Allow anyone to insert audit results (no auth required for public tool)
create policy "audits_insertable" on restaurant_audits
  for insert
  with check (true);

-- Allow anyone to insert email signups
create policy "email_signups_insertable" on email_signups
  for insert
  with check (true);

-- Only authenticated users (Tony) can view all audits via dashboard
create policy "audits_viewable_by_auth" on restaurant_audits
  for select
  using (auth.role() = 'authenticated');

-- Create indexes for performance
create index idx_restaurant_audits_created_at on restaurant_audits(created_at desc);
create index idx_restaurant_audits_score on restaurant_audits(total_score desc);
create index idx_email_signups_created_at on email_signups(created_at desc);
