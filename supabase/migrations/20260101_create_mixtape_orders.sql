-- TKFM V2: Mixtape Orders (persistent storage)
create table if not exists public.mixtape_orders (
  id text primary key,
  created_at timestamptz not null default now(),
  status text not null default 'new',
  tier text not null,

  artist_name text not null,
  email text not null,
  phone text,

  mixtape_title text not null,
  download text,
  tracklist text,
  socials text,
  notes text
);

create index if not exists mixtape_orders_created_at_idx on public.mixtape_orders (created_at desc);
create index if not exists mixtape_orders_email_idx on public.mixtape_orders (email);

-- Recommended: enable RLS and only access via Service Role in Netlify functions
alter table public.mixtape_orders enable row level security;

-- No public policies on purpose (Service Role bypasses RLS).
-- If you ever want client-side inserts, we can add safe policies later.
