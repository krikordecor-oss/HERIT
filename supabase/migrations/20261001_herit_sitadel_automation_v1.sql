-- HERIT SITADEL automation v1
-- Applied to Supabase 2026-10-01.
-- Includes sync audit tables, protected server secret, daily cron, and new-commune trigger.

create table if not exists public.source_sync_state (
  source_key text primary key references public.data_source_registry(source_key) on delete cascade,
  upstream_last_modified timestamptz,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_status text,
  last_error text,
  last_rows_seen integer not null default 0,
  last_rows_upserted integer not null default 0,
  cursor_insee text,
  updated_at timestamptz not null default now()
);

create table if not exists public.source_sync_runs (
  id bigint generated always as identity primary key,
  source_key text not null references public.data_source_registry(source_key) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check(status in ('running','success','partial','failed','noop')),
  upstream_last_modified timestamptz,
  communes_count integer not null default 0,
  rows_seen integer not null default 0,
  rows_upserted integer not null default 0,
  events_upserted integer not null default 0,
  error text,
  details jsonb not null default '{}'::jsonb
);

create table if not exists public.sitadel_records (
  id uuid primary key default gen_random_uuid(),
  source_dataset_id text not null,
  source_datafile_rid text not null,
  source_record_key text not null,
  insee_code text,
  authorization_id text,
  authorization_type text,
  address_text text,
  parcel_ids jsonb not null default '[]'::jsonb,
  application_date date,
  authorization_date date,
  start_date date,
  completion_date date,
  cancellation_date date,
  housing_units integer,
  floor_area_m2 numeric,
  raw_payload jsonb not null,
  upstream_last_modified timestamptz,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_datafile_rid, source_record_key)
);

create table if not exists public.sync_secrets (
  key text primary key,
  secret text not null,
  created_at timestamptz not null default now()
);
alter table public.sync_secrets enable row level security;
alter table public.source_sync_state enable row level security;
alter table public.source_sync_runs enable row level security;
alter table public.sitadel_records enable row level security;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- The live environment also contains:
-- 1. cron job herit-sitadel-daily-sync at 03:17 UTC
-- 2. trigger trg_queue_sitadel_for_building after insert/update of buildings.insee_code
-- Secrets are generated server-side and intentionally not committed.
