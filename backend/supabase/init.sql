-- Supabase schema initialization for Il Mondo di Ugo
-- Newsletter subscribers table
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Contacts table
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Uploads metadata table
create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  url text,
  filename text not null,
  content_type text,
  size bigint,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.newsletter_subscribers enable row level security;
alter table public.contacts enable row level security;
alter table public.uploads enable row level security;

-- Policies
-- Revoke broad access (docs note: Supabase by default grants to authenticated roles; ensure no PUBLIC grants)
-- Adjust policies for stricter RLS

-- Drop existing permissive policies if necessary (idempotent safe guards)
-- (Supabase SQL editor may require manual drop if names differ)

-- Newsletter subscribers: allow only insert for anon; no select/update/delete
create policy if not exists anon_insert_newsletter on public.newsletter_subscribers
  for insert to anon with check ( true );

-- Contacts: only insert
create policy if not exists anon_insert_contacts on public.contacts
  for insert to anon with check ( true );

-- Uploads: allow insert + (optional) select. Comment out select if you want private metadata.
create policy if not exists anon_insert_uploads on public.uploads
  for insert to anon with check ( true );
-- Public gallery listing (keep) – remove if not desired
create policy if not exists anon_select_uploads on public.uploads
  for select to anon using ( true );

-- (Optional) future service role policies (service_role bypasses RLS automatically).

-- Harden: no update/delete policies defined = operations blocked for anon/auth.

-- Storage bucket creation note: create bucket 'uploads' manually or via dashboard.
-- Example (not executable in SQL editor): select storage.create_bucket('uploads', public => true);

-- Indexes
create index if not exists idx_newsletter_email on public.newsletter_subscribers (email);
create index if not exists idx_contacts_email on public.contacts (email);
create index if not exists idx_uploads_created_at on public.uploads (created_at);
