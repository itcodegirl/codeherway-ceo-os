-- Audit trail for telemetry signature verification decisions.
-- Records key metadata used at ingest-time to support key-rotation and incident forensics.

create table if not exists public.app_error_telemetry_key_audit_events (
  id uuid primary key default gen_random_uuid(),
  request_id text not null default '',
  source text not null default '',
  event_type text not null default '',
  verification_mode text not null default '',
  signature_key_id text not null default '',
  signature_algorithm text not null default '',
  verification_result boolean not null default false,
  key_source text not null default '',
  key_version text not null default '',
  key_metadata jsonb not null default '{}'::jsonb,
  error_code text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists app_error_telemetry_key_audit_events_created_at_idx
  on public.app_error_telemetry_key_audit_events(created_at desc);

create index if not exists app_error_telemetry_key_audit_events_signature_key_id_idx
  on public.app_error_telemetry_key_audit_events(signature_key_id);

create index if not exists app_error_telemetry_key_audit_events_verification_result_idx
  on public.app_error_telemetry_key_audit_events(verification_result);

revoke all on table public.app_error_telemetry_key_audit_events from anon, authenticated;
grant select, insert on table public.app_error_telemetry_key_audit_events to service_role;
