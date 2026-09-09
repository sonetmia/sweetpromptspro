create extension if not exists pgcrypto;

create table if not exists public.auth_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  whatsapp_number text not null unique,
  email text,
  student_id text unique,
  password_hash text not null,
  role text not null default 'STUDENT' check (role in ('STUDENT', 'SUPER_ADMIN')),
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index if not exists auth_users_status_idx on public.auth_users(status);
create index if not exists auth_users_role_idx on public.auth_users(role);
create index if not exists auth_users_created_at_idx on public.auth_users(created_at desc);

create table if not exists public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auth_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  remember_device boolean not null default false
);

create index if not exists auth_sessions_user_id_idx on public.auth_sessions(user_id);
create index if not exists auth_sessions_expires_at_idx on public.auth_sessions(expires_at);

create or replace function public.set_auth_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists auth_users_updated_at on public.auth_users;
create trigger auth_users_updated_at
before update on public.auth_users
for each row execute function public.set_auth_users_updated_at();

alter table public.auth_users enable row level security;
alter table public.auth_sessions enable row level security;

revoke all on table public.auth_users from anon, authenticated;
revoke all on table public.auth_sessions from anon, authenticated;
