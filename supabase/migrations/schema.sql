-- Enable UUID extensions
create extension if not exists "uuid-ossp";

-- Create Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone default now(),
  goal text,
  weight numeric,
  height numeric,
  age integer,
  activity_level text,
  training_days integer,
  equipment text,
  diet_preference text
);

-- Create Workout Plans Table
create table if not exists public.workout_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  name text not null,
  language text not null default 'tr',
  plan_data jsonb not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.workout_plans enable row level security;

-- Profiles Policies
create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Users can insert own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- Workout Plans Policies
create policy "Users can view own plans" 
  on public.workout_plans for select 
  using (auth.uid() = user_id);

create policy "Users can insert own plans" 
  on public.workout_plans for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own plans" 
  on public.workout_plans for update 
  using (auth.uid() = user_id);

create policy "Users can delete own plans" 
  on public.workout_plans for delete 
  using (auth.uid() = user_id);

-- Auto-create profile trigger on sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, updated_at)
  values (new.id, now());
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
