-- Materialize deterministic GB UPRN identities into the HERIT Building Graph.
-- Idempotent: buildings.external_key is unique and all joins use exact UPRN equality.
-- Source rights are checked before writes; no fuzzy matching is performed.
do $$
begin
  if not exists (
    select 1 from public.data_source_registry
    where source_key = 'gb-hmlr-uprn'
      and legal_status = 'approved'
      and commercial_use_allowed is true
      and storage_allowed is true
  ) then
    raise exception 'gb-hmlr-uprn is not approved for commercial storage';
  end if;
end $$;

insert into public.buildings
  (external_key, country_code, primary_source, primary_source_id, herit_id)
select distinct
  'GB:UPRN:' || pi.identifier_value,
  'GB',
  'gb-hmlr-uprn',
  pi.identifier_value,
  'HERIT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 20))
from public.property_identifiers pi
where pi.country_code = 'GB'
  and pi.identifier_type = 'UPRN'
  and pi.identifier_value is not null
on conflict (external_key) do nothing;

update public.property_identifiers pi
set building_id = b.id,
    last_seen_at = now()
from public.buildings b
where pi.country_code = 'GB'
  and pi.identifier_type = 'UPRN'
  and pi.building_id is null
  and b.external_key = 'GB:UPRN:' || pi.identifier_value;

update public.property_transactions t
set building_id = b.id,
    updated_at = now()
from public.buildings b
where t.country_code = 'GB'
  and t.property_identifier_type = 'UPRN'
  and t.property_identifier is not null
  and t.building_id is null
  and b.external_key = 'GB:UPRN:' || t.property_identifier;
