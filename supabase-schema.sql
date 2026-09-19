-- Tvideo database for Supabase + Vercel
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.tvideo_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  username text not null unique,
  phone text not null,
  password_hash text not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tvideo_sessions (
  token text primary key,
  user_id uuid not null references public.tvideo_users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.tvideo_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.tvideo_users(id) on delete cascade,
  phone text not null,
  amount integer not null default 16000,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create index if not exists tvideo_users_username_idx on public.tvideo_users(username);
create index if not exists tvideo_sessions_user_id_idx on public.tvideo_sessions(user_id);
create index if not exists tvideo_payments_user_id_idx on public.tvideo_payments(user_id);
create index if not exists tvideo_payments_status_idx on public.tvideo_payments(status);
create index if not exists tvideo_payments_created_at_idx on public.tvideo_payments(created_at desc);

-- The browser never talks directly to these tables in this implementation.
-- All database access goes through the server using SUPABASE_SERVICE_ROLE_KEY.
-- RLS therefore stays enabled with no public policies.
alter table public.tvideo_users enable row level security;
alter table public.tvideo_sessions enable row level security;
alter table public.tvideo_payments enable row level security;

-- Keep this optional cleanup available if old test sessions are left behind:
-- delete from public.tvideo_sessions where created_at < now() - interval '30 days';
