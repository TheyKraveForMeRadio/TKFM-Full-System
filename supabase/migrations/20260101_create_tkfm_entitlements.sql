-- TKFM V2: server-side entitlements (Stripe -> Supabase)
create table if not exists public.tkfm_entitlements (
  customer_id text primary key,
  email text,
  status text not null default 'active', -- active | past_due | canceled | unknown
  unlocks jsonb not null default '[]'::jsonb,
  last_event_type text,
  updated_at timestamptz not null default now()
);

create index if not exists tkfm_entitlements_email_idx on public.tkfm_entitlements (email);

create table if not exists public.tkfm_purchase_events (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  event_type text not null,
  customer_id text,
  email text,
  payload jsonb
);

create index if not exists tkfm_purchase_events_created_at_idx on public.tkfm_purchase_events (created_at desc);
create index if not exists tkfm_purchase_events_customer_idx on public.tkfm_purchase_events (customer_id);

alter table public.tkfm_entitlements enable row level security;
alter table public.tkfm_purchase_events enable row level security;

-- No public policies. Netlify Functions use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
