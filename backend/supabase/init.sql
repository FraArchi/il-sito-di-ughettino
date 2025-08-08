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
-- Newsletter: allow anonymous insert only
create policy if not exists anon_insert_newsletter on public.newsletter_subscribers
  for insert to anon with check ( true );

-- Newsletter: disallow select for anon (no policy) – You can add a policy for service role or authenticated later.

-- Contacts: allow insert only
create policy if not exists anon_insert_contacts on public.contacts
  for insert to anon with check ( true );

-- Uploads: allow insert of own metadata (public) - minimal check
create policy if not exists anon_insert_uploads on public.uploads
  for insert to anon with check ( true );

-- Allow public select of uploads if needed for gallery
create policy if not exists anon_select_uploads on public.uploads
  for select to anon using ( true );

-- (Optional) tighten: block update/delete for anon by omitting policies

-- Storage bucket creation note: create bucket 'uploads' manually or via dashboard.
-- Example (not executable in SQL editor): select storage.create_bucket('uploads', public => true);

-- Indexes
create index if not exists idx_newsletter_email on public.newsletter_subscribers (email);
create index if not exists idx_contacts_email on public.contacts (email);
create index if not exists idx_uploads_created_at on public.uploads (created_at);
