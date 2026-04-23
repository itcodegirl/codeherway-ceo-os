-- Incident lifecycle telemetry for scheduled ops alerts.
-- Captures state transitions and supports notification dedupe based on state changes.

create table if not exists public.ops_incident_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  incident_key text not null,
  previous_state text not null default '',
  next_state text not null default '',
  state_changed boolean not null default false,
  transition_reason text not null default '',
  route_trend_outcome text not null default '',
  telemetry_health_outcome text not null default '',
  telemetry_endpoint_slo_outcome text not null default '',
  issue_number integer,
  issue_url text not null default '',
  run_id text not null default '',
  run_url text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (incident_key, run_id)
);

create index if not exists ops_incident_lifecycle_events_incident_key_created_idx
  on public.ops_incident_lifecycle_events(incident_key, created_at desc);

create index if not exists ops_incident_lifecycle_events_next_state_idx
  on public.ops_incident_lifecycle_events(next_state);

revoke all on table public.ops_incident_lifecycle_events from anon, authenticated;
grant select on table public.ops_incident_lifecycle_events to authenticated, service_role;
grant insert, update on table public.ops_incident_lifecycle_events to service_role;
