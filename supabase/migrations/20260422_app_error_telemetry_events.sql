-- Durable ingest sink for browser app error telemetry batches.
-- Stores idempotent payload envelopes and exposes a retention prune RPC
-- used by server ingestion workers.

create table if not exists public.app_error_telemetry_events (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null,
  source text not null default '',
  event_type text not null default 'app_error',
  sent_at timestamptz not null,
  events jsonb not null default '[]'::jsonb,
  event_count integer not null default 0,
  request_id text not null default '',
  signature_verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (idempotency_key)
);

create index if not exists app_error_telemetry_events_created_at_idx
  on public.app_error_telemetry_events(created_at desc);

create index if not exists app_error_telemetry_events_source_idx
  on public.app_error_telemetry_events(source);

create index if not exists app_error_telemetry_events_event_type_idx
  on public.app_error_telemetry_events(event_type);

create or replace function public.prune_old_app_error_telemetry_events(
  retention_days integer default 45,
  max_rows integer default 50000
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_retention integer := greatest(coalesce(retention_days, 45), 1);
  normalized_max_rows integer := greatest(coalesce(max_rows, 50000), 1);
  deleted_for_age integer := 0;
  deleted_for_count integer := 0;
begin
  delete from public.app_error_telemetry_events
  where created_at < now() - make_interval(days => normalized_retention);
  GET DIAGNOSTICS deleted_for_age = ROW_COUNT;

  with ranked as (
    select
      id,
      row_number() over (
        order by created_at desc, id desc
      ) as row_num
    from public.app_error_telemetry_events
  ),
  overflow as (
    select id
    from ranked
    where row_num > normalized_max_rows
  )
  delete from public.app_error_telemetry_events target
  using overflow
  where target.id = overflow.id;
  GET DIAGNOSTICS deleted_for_count = ROW_COUNT;

  return jsonb_build_object(
    'deleted_for_age', deleted_for_age,
    'deleted_for_count', deleted_for_count
  );
end;
$$;

revoke all on table public.app_error_telemetry_events from anon, authenticated;
grant select, insert on table public.app_error_telemetry_events to service_role;

revoke all on function public.prune_old_app_error_telemetry_events(integer, integer)
  from anon, authenticated;
grant execute on function public.prune_old_app_error_telemetry_events(integer, integer)
  to service_role;
