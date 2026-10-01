-- HERIT Future Core v1
-- Temporal graph, component passports, spatial anchors, agent-ready context.
-- Applied to Supabase on 2026-10-01.

create table if not exists public.building_events (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  event_type text not null,
  event_date date,
  occurred_at timestamptz,
  title text not null,
  summary text,
  source_kind text not null check (source_kind in ('official','user_observation','herit_derived','partner','import')),
  source_name text,
  source_record_id text,
  confidence_score numeric check (confidence_score between 0 and 100),
  evidence_json jsonb not null default '{}'::jsonb,
  visibility text not null default 'private' check (visibility in ('private','team','verified_public')),
  created_at timestamptz not null default now()
);

create index if not exists building_events_building_occurred_idx on public.building_events(building_id, occurred_at desc);
create index if not exists building_events_building_date_idx on public.building_events(building_id, event_date desc);

create table if not exists public.building_components (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  parent_component_id uuid references public.building_components(id) on delete set null,
  component_type text not null,
  label text,
  manufacturer text,
  model text,
  serial_number text,
  installed_on date,
  removed_on date,
  condition_status text,
  lifecycle_status text not null default 'active' check (lifecycle_status in ('planned','active','maintenance_due','replaced','removed','unknown')),
  source_kind text not null default 'herit_derived' check (source_kind in ('official','user_observation','herit_derived','partner','import')),
  source_name text,
  confidence_score numeric check (confidence_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists building_components_building_idx on public.building_components(building_id, component_type);

create table if not exists public.component_passports (
  id uuid primary key default gen_random_uuid(),
  component_id uuid not null references public.building_components(id) on delete cascade,
  passport_uri text,
  passport_standard text,
  product_identifier text,
  technical_data jsonb not null default '{}'::jsonb,
  environmental_data jsonb not null default '{}'::jsonb,
  maintenance_data jsonb not null default '{}'::jsonb,
  interoperability jsonb not null default '{}'::jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(component_id)
);

create table if not exists public.spatial_anchors (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  component_id uuid references public.building_components(id) on delete cascade,
  anchor_type text not null check (anchor_type in ('building','facade','roof','entrance','window','equipment','room','custom')),
  latitude double precision,
  longitude double precision,
  altitude_m double precision,
  local_x_m double precision,
  local_y_m double precision,
  local_z_m double precision,
  heading_deg numeric,
  pitch_deg numeric,
  roll_deg numeric,
  coordinate_frame text not null default 'WGS84',
  provider text,
  provider_anchor_id text,
  confidence_score numeric check (confidence_score between 0 and 100),
  visibility text not null default 'private' check (visibility in ('private','team','verified_public')),
  created_at timestamptz not null default now()
);

create index if not exists spatial_anchors_building_idx on public.spatial_anchors(building_id, anchor_type);

create table if not exists public.agent_access_policies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  policy_name text not null,
  allowed_scopes text[] not null default array['building.read']::text[],
  max_requests_per_hour integer not null default 120,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.building_events enable row level security;
alter table public.building_components enable row level security;
alter table public.component_passports enable row level security;
alter table public.spatial_anchors enable row level security;
alter table public.agent_access_policies enable row level security;

create policy "agent_policy_owner_read" on public.agent_access_policies for select using (owner_user_id = auth.uid());
create policy "agent_policy_owner_write" on public.agent_access_policies for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
