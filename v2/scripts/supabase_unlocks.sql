-- RUN IN SUPABASE SQL EDITOR

create table if not exists public.tkfm_unlocks (
  session_id text primary key,
  customer_email text,
  unlock_id text,
  unlock jsonb,
  created_at timestamptz default now()
);

create index if not exists tkfm_unlocks_customer_email_idx on public.tkfm_unlocks (customer_email);
