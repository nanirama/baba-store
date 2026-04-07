-- ============================================
-- SUPABASE SETUP SCRIPT
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Enable Row Level Security on auth.users (already enabled by default)
-- No action needed for built-in auth.users table

-- 2. Create a public profiles table to store extended user data
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Enable RLS on profiles
alter table public.profiles enable row level security;

-- 4. Policy: Users can only read their own profile
create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- 5. Policy: Users can update their own profile
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- 6. Trigger: Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'user')
  );
  return new;
end;
$$;

-- Drop trigger if it already exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. To assign admin role to your existing user:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';

-- 8. Also update user metadata so NextAuth picks up the role:
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'your@email.com';
