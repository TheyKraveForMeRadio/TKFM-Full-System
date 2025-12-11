
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

create table if not exists artist_submissions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id),
 artist_name text,
 track_title text,
 image_url text,
 track_url text,
 price_paid numeric,
 status text default 'pending',
 created_at timestamptz default now()
);

create table if not exists mixtapes (
 id uuid primary key default gen_random_uuid(),
 title text,
 description text,
 cover_path text,
 audio_path text,
 price_id text,
 published boolean default false,
 created_at timestamptz default now()
);

create table if not exists purchases (
 id uuid primary key default gen_random_uuid(),
 price_id text,
 session_id text,
 status text default 'pending',
 metadata jsonb,
 created_at timestamptz default now()
);

create table if not exists mixtape_purchases (
 id uuid primary key default gen_random_uuid(),
 mixtape_id uuid references mixtapes(id),
 user_email text,
 stripe_session text,
 status text,
 download_url text,
 purchased_at timestamptz default now()
);

create table if not exists news_posts (
 id uuid primary key default gen_random_uuid(),
 title text,
 slug text,
 excerpt text,
 body text,
 author text,
 created_at timestamptz default now()
);

create table if not exists analytics (
  id uuid primary key default gen_random_uuid(),
  event_type text,
  payload jsonb,
  created_at timestamptz default now()
);
