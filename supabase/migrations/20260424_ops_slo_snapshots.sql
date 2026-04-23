-- Durable storage for scheduled route/telemetry SLO snapshots.
-- Keeps a queryable run history for trend dashboards and incident forensics.

create table if not exists public.ops_slo_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id text not null,
  run_number text not null default '',
  run_url text not null default '',
  repository text not null default '',
  git_ref text not null default '',
  captured_at timestamptz not null,
  route_trend_outcome text not null default '',
  telemetry_health_outcome text not null default '',
  telemetry_endpoint_slo_outcome text not null default '',
  telemetry_health_failure_rate_pct numeric,
  telemetry_health_max_failure_rate_pct numeric,
  telemetry_endpoint_slo_p95_ms numeric,
  telemetry_endpoint_slo_non_2xx_rate_pct numeric,
  telemetry_endpoint_slo_max_p95_ms numeric,
  telemetry_endpoint_slo_max_non_2xx_rate_pct numeric,
  reports_excerpt jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (run_id)
);

create index if not exists ops_slo_snapshots_captured_at_idx
  on public.ops_slo_snapshots(captured_at desc);

create index if not exists ops_slo_snapshots_route_trend_outcome_idx
  on public.ops_slo_snapshots(route_trend_outcome);

create index if not exists ops_slo_snapshots_telemetry_health_outcome_idx
  on public.ops_slo_snapshots(telemetry_health_outcome);

create index if not exists ops_slo_snapshots_telemetry_endpoint_slo_outcome_idx
  on public.ops_slo_snapshots(telemetry_endpoint_slo_outcome);

revoke all on table public.ops_slo_snapshots from anon, authenticated;
grant select on table public.ops_slo_snapshots to anon, authenticated;
grant select, insert, update on table public.ops_slo_snapshots to service_role;
