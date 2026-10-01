-- HERIT Cloud Security v1
alter table public.buildings enable row level security;
alter table public.building_facts enable row level security;
alter table public.audit_events enable row level security;
alter table public.abuse_reports enable row level security;
alter table public.sensitive_access_events enable row level security;

drop policy if exists "subscription_self_read" on public.subscription_accounts;
create policy "subscription_self_read" on public.subscription_accounts
for select using (auth.uid() = user_id);

drop policy if exists "abuse_authenticated_insert" on public.abuse_reports;
create policy "abuse_authenticated_insert" on public.abuse_reports
for insert to authenticated
with check (auth.uid() = reporter_user_id);

-- Intentionally no client policies on buildings, building_facts,
-- audit_events, sensitive_access_events. Server-controlled only.
