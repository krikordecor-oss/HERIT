-- HERIT Cloud Core v1
-- Global building graph, scans, observations, provenance, teams and subscriptions.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  ui_locale text not null default 'en-US',
  speech_locale text not null default 'en-US',
  professional_mode text not null default 'Immobilier',
  country_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  external_key text unique,
  country_code text,
  primary_source text,
  primary_source_id text,
  address_original text,
  address_normalized text,
  locality text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists buildings_country_idx on public.buildings(country_code);
create index if not exists buildings_source_idx on public.buildings(primary_source, primary_source_id);
create index if not exists buildings_lat_lon_idx on public.buildings(latitude, longitude);

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  scanned_at timestamptz not null default now(),
  user_latitude double precision,
  user_longitude double precision,
  gps_accuracy_m numeric,
  heading_deg numeric,
  distance_m numeric,
  targeting_confidence numeric check (targeting_confidence between 0 and 100),
  detection_mode text,
  app_version text,
  device_locale text,
  speech_locale text,
  building_country_code text,
  created_at timestamptz not null default now()
);

create index if not exists scans_building_idx on public.scans(building_id, scanned_at desc);
create index if not exists scans_user_idx on public.scans(user_id, scanned_at desc);

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  scan_id uuid references public.scans(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  text_original text not null,
  original_language text,
  text_normalized text,
  normalized_language text,
  status text not null default 'declared'
    check (status in ('declared','observed','corroborated','verified','disputed','stale')),
  confidence_score numeric check (confidence_score between 0 and 100),
  evidence_type text not null default 'none'
    check (evidence_type in ('none','photo','document','audio','video','multi')),
  professional_mode text,
  building_country_code text,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create index if not exists observations_building_idx on public.observations(building_id, created_at desc);
create index if not exists observations_user_idx on public.observations(user_id, created_at desc);
create index if not exists observations_status_idx on public.observations(status);

create table if not exists public.building_facts (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  fact_key text not null,
  value_json jsonb not null,
  source_kind text not null
    check (source_kind in ('official','user_observation','herit_derived','partner','import')),
  source_name text,
  source_record_id text,
  source_observation_id uuid references public.observations(id) on delete set null,
  confidence_score numeric check (confidence_score between 0 and 100),
  valid_from timestamptz,
  valid_to timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists building_facts_lookup_idx on public.building_facts(building_id, fact_key);
create index if not exists building_facts_source_idx on public.building_facts(source_kind, source_name);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table if not exists public.saved_buildings (
  user_id uuid not null references auth.users(id) on delete cascade,
  building_id uuid not null references public.buildings(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, building_id)
);

create table if not exists public.subscription_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'inactive',
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((user_id is not null) or (team_id is not null))
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.scans enable row level security;
alter table public.observations enable row level security;
alter table public.saved_buildings enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.subscription_accounts enable row level security;

create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_self_write" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "scans_owner_read" on public.scans
  for select using (auth.uid() = user_id);
create policy "scans_owner_insert" on public.scans
  for insert with check (auth.uid() = user_id);

create policy "observations_owner_read" on public.observations
  for select using (auth.uid() = user_id);
create policy "observations_owner_insert" on public.observations
  for insert with check (auth.uid() = user_id);
create policy "observations_owner_update" on public.observations
  for update using (auth.uid() = user_id);

create policy "saved_buildings_self" on public.saved_buildings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "teams_members_read" on public.teams
  for select using (
    owner_user_id = auth.uid() or exists (
      select 1 from public.team_members tm where tm.team_id = id and tm.user_id = auth.uid()
    )
  );

create policy "team_members_members_read" on public.team_members
  for select using (
    user_id = auth.uid() or exists (
      select 1 from public.teams t where t.id = team_id and t.owner_user_id = auth.uid()
    )
  );

-- Buildings and building facts are intentionally not granted public write access.
-- Ingestion will go through trusted server-side functions / service-role workers.

comment on table public.buildings is 'Canonical HERIT Building Graph nodes.';
comment on table public.scans is 'Immutable field scan events used to improve targeting and data freshness.';
comment on table public.observations is 'Human field observations with provenance and verification status.';
comment on table public.building_facts is 'Normalized facts from official, observed, partner and HERIT-derived sources.';
