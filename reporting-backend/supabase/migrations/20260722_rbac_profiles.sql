-- ============================================================
-- SAISOKU OMNIX - RBAC Database Setup
-- File: 20260722_rbac_profiles.sql
-- ============================================================

-- 1. Create Enum User Role (5 Roles)
do $$ 
begin
    if not exists (select 1 from pg_type where typname = 'user_role') then
        create type public.user_role as enum ('super_admin', 'manager', 'spv', 'agent', 'guest');
    end if;
end $$;

-- 2. Create Public Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.user_role not null default 'guest',
  brand_access text[] default array['ALL'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Enable RLS on Profiles
alter table public.profiles enable row level security;

-- 4. RLS Policies for Profiles
drop policy if exists "Users can view their own profile or Super Admin view all" on public.profiles;
create policy "Users can view their own profile or Super Admin view all" 
  on public.profiles for select 
  using (auth.uid() = id or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'super_admin'
  ));

drop policy if exists "Super Admins can manage all profiles" on public.profiles;
create policy "Super Admins can manage all profiles" 
  on public.profiles for all 
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'super_admin'
  ));

-- 5. Trigger for Auto Profile Creation on Supabase Auth Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'guest')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger updated_at
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
