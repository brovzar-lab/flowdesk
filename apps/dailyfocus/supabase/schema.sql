-- DailyFocus Database Schema
-- Run this in your Supabase SQL editor

-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- Users profile (extends Supabase auth.users)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  timezone text not null default 'UTC',
  reminder_time time not null default '08:00',
  created_at timestamptz not null default now()
);

-- Day plans (one per user per day)
create table if not exists public.day_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

-- Tasks (1-3 per day plan)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  day_plan_id uuid not null references public.day_plans(id) on delete cascade,
  title text not null,
  note text,
  position smallint not null check (position between 1 and 3),
  status text not null default 'todo' check (status in ('todo', 'done', 'carried_over')),
  completed_at timestamptz,
  unique(day_plan_id, position)
);

-- Focus sessions
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes integer
);

-- Row Level Security
alter table public.user_profiles enable row level security;
alter table public.day_plans enable row level security;
alter table public.tasks enable row level security;
alter table public.focus_sessions enable row level security;

-- RLS Policies: users can only see and modify their own data
create policy "user_profiles: own data" on public.user_profiles
  for all using (auth.uid() = id);

create policy "day_plans: own data" on public.day_plans
  for all using (auth.uid() = user_id);

create policy "tasks: own data" on public.tasks
  for all using (
    exists (
      select 1 from public.day_plans
      where id = tasks.day_plan_id and user_id = auth.uid()
    )
  );

create policy "focus_sessions: own data" on public.focus_sessions
  for all using (auth.uid() = user_id);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Indexes for performance
create index if not exists idx_day_plans_user_date on public.day_plans(user_id, date desc);
create index if not exists idx_tasks_day_plan on public.tasks(day_plan_id, position);
create index if not exists idx_focus_sessions_task on public.focus_sessions(task_id);
create index if not exists idx_focus_sessions_user on public.focus_sessions(user_id, started_at desc);
