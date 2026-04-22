-- Chief of Staff telemetry events
-- Tracks AI generation and structured acceptance reliability signals per user.

create table if not exists public.chief_telemetry_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chief_telemetry_events_user_id_idx
  on public.chief_telemetry_events(user_id);

create index if not exists chief_telemetry_events_created_at_idx
  on public.chief_telemetry_events(created_at desc);

create index if not exists chief_telemetry_events_event_name_idx
  on public.chief_telemetry_events(event_name);

alter table public.chief_telemetry_events
  alter column user_id set default auth.uid();

alter table public.chief_telemetry_events enable row level security;

drop policy if exists "chief_telemetry_events_own_all" on public.chief_telemetry_events;
create policy "chief_telemetry_events_own_all"
on public.chief_telemetry_events for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
