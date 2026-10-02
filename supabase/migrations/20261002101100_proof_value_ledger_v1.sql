-- HERIT Proof-of-Value ledger v1
-- Records funnel, retention and referral outcomes without automatic HERIT attribution.
create table if not exists public.proof_value_events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid null references public.teams(id) on delete set null,
  user_id uuid null references auth.users(id) on delete set null,
  building_id uuid null references public.buildings(id) on delete set null,
  opportunity_score_id uuid null references public.opportunity_scores(id) on delete set null,
  event_type text not null check (event_type in ('opportunity','contact','estimate','mandate','sale','retained','referral_invited','referral_converted')),
  occurred_at timestamptz not null,
  value_amount_cents bigint null check (value_amount_cents is null or value_amount_cents >= 0),
  currency text null check (currency is null or currency ~ '^[A-Z]{3}$'),
  capture_source text not null default 'manual' check (capture_source in ('manual','system','import')),
  attribution_status text not null default 'unclaimed' check (attribution_status in ('unclaimed','assisted','verified','rejected')),
  attribution_basis jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (value_amount_cents is null or currency is not null),
  check (attribution_status <> 'verified' or opportunity_score_id is not null),
  check (event_type <> 'sale' or attribution_status <> 'verified' or jsonb_typeof(evidence) = 'object')
);
comment on table public.proof_value_events is
'Append-only Proof-of-Value ledger. Commercial outcomes are not attributed to HERIT unless explicitly evidenced; verified attribution requires an opportunity score reference.';
alter table public.proof_value_events enable row level security;
create index if not exists proof_value_events_team_time_idx on public.proof_value_events(team_id, occurred_at desc);
create index if not exists proof_value_events_user_time_idx on public.proof_value_events(user_id, occurred_at desc);
create index if not exists proof_value_events_building_time_idx on public.proof_value_events(building_id, occurred_at desc);
create index if not exists proof_value_events_type_time_idx on public.proof_value_events(event_type, occurred_at desc);
