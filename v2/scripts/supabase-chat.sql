-- TKFM Station Chat (Supabase) — minimal schema + RLS
-- 1) In Supabase SQL Editor, run this file.
-- 2) Confirm Realtime is enabled for chat_messages (Database -> Replication).
-- 3) Your site uses VITE_SUPABASE_URL + VITE_SUPABASE_ANON.

create table if not exists public.chat_messages (
  id bigserial primary key,
  room text not null default 'global',
  display_name text not null default 'Guest',
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_room_created_at_idx
  on public.chat_messages (room, created_at);

alter table public.chat_messages enable row level security;

-- Public read
drop policy if exists "chat_read_public" on public.chat_messages;
create policy "chat_read_public"
on public.chat_messages
for select
to anon, authenticated
using (true);

-- Public write (basic)
drop policy if exists "chat_insert_public" on public.chat_messages;
create policy "chat_insert_public"
on public.chat_messages
for insert
to anon, authenticated
with check (
  length(message) between 1 and 420
  and length(display_name) between 1 and 40
);

-- Optional: allow delete/update later for moderators only (recommended to add later).
