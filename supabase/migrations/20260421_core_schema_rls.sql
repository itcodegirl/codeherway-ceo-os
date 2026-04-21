-- Enable UUID generation if not already enabled
create extension if not exists pgcrypto;

-- =========================
-- profiles / user settings
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  team_name text not null default 'CodeHerWay',
  timezone text not null default 'America/Chicago',
  email_digest boolean not null default true,
  keyboard_shortcuts boolean not null default false,
  auto_save boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- opportunities
-- =========================
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  company text not null default '',
  priority text not null default 'Low',
  stage text not null default 'New',
  next_step text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists opportunities_user_id_idx
  on public.opportunities(user_id);

create index if not exists opportunities_stage_idx
  on public.opportunities(stage);

-- =========================
-- content items
-- =========================
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  platform text not null default '',
  status text not null default 'Drafting',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_items_user_id_idx
  on public.content_items(user_id);

create index if not exists content_items_status_idx
  on public.content_items(status);

-- =========================
-- weekly briefs
-- =========================
create table if not exists public.weekly_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  review_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index if not exists weekly_briefs_user_id_idx
  on public.weekly_briefs(user_id);

-- =========================
-- weekly brief items
-- =========================
create table if not exists public.weekly_brief_items (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references public.weekly_briefs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('priority', 'win', 'blocker')),
  title text not null default '',
  description text not null default '',
  owner text not null default '',
  status text not null default '',
  category text not null default '',
  severity text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists weekly_brief_items_brief_id_idx
  on public.weekly_brief_items(brief_id);

create index if not exists weekly_brief_items_user_id_idx
  on public.weekly_brief_items(user_id);

create index if not exists weekly_brief_items_type_idx
  on public.weekly_brief_items(item_type);

-- =========================
-- chief of staff sessions
-- =========================
create table if not exists public.chief_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_key text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists chief_sessions_user_id_idx
  on public.chief_sessions(user_id);

-- =========================
-- chief outputs
-- =========================
create table if not exists public.chief_outputs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chief_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  output_type text not null default 'response',
  title text not null default '',
  content text not null default '',
  structured_payload jsonb not null default '{}'::jsonb,
  source text not null default 'proxy',
  created_at timestamptz not null default now()
);

create index if not exists chief_outputs_session_id_idx
  on public.chief_outputs(session_id);

create index if not exists chief_outputs_user_id_idx
  on public.chief_outputs(user_id);

create index if not exists chief_outputs_type_idx
  on public.chief_outputs(output_type);

-- =========================
-- updated_at trigger helper
-- =========================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_opportunities_updated_at on public.opportunities;
create trigger set_opportunities_updated_at
before update on public.opportunities
for each row execute function public.set_updated_at();

drop trigger if exists set_content_items_updated_at on public.content_items;
create trigger set_content_items_updated_at
before update on public.content_items
for each row execute function public.set_updated_at();

drop trigger if exists set_weekly_briefs_updated_at on public.weekly_briefs;
create trigger set_weekly_briefs_updated_at
before update on public.weekly_briefs
for each row execute function public.set_updated_at();

drop trigger if exists set_weekly_brief_items_updated_at on public.weekly_brief_items;
create trigger set_weekly_brief_items_updated_at
before update on public.weekly_brief_items
for each row execute function public.set_updated_at();

-- =========================
-- row level security
-- =========================
alter table public.profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.content_items enable row level security;
alter table public.weekly_briefs enable row level security;
alter table public.weekly_brief_items enable row level security;
alter table public.chief_sessions enable row level security;
alter table public.chief_outputs enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id);

-- opportunities
drop policy if exists "opportunities_own_all" on public.opportunities;
create policy "opportunities_own_all"
on public.opportunities for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- content_items
drop policy if exists "content_items_own_all" on public.content_items;
create policy "content_items_own_all"
on public.content_items for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- weekly_briefs
drop policy if exists "weekly_briefs_own_all" on public.weekly_briefs;
create policy "weekly_briefs_own_all"
on public.weekly_briefs for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- weekly_brief_items
drop policy if exists "weekly_brief_items_own_all" on public.weekly_brief_items;
create policy "weekly_brief_items_own_all"
on public.weekly_brief_items for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- chief_sessions
drop policy if exists "chief_sessions_own_all" on public.chief_sessions;
create policy "chief_sessions_own_all"
on public.chief_sessions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- chief_outputs
drop policy if exists "chief_outputs_own_all" on public.chief_outputs;
create policy "chief_outputs_own_all"
on public.chief_outputs for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
