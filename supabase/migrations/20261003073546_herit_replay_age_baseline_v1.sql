-- HERIT replay age baseline v1
-- Leakage guard: features use only transactions strictly before p_cutoff.
-- Target: category A transactions in [p_cutoff, p_cutoff + horizon).
create or replace function public.herit_replay_age_baseline(
  p_cutoff date,
  p_horizon_days integer default 365,
  p_top_fraction numeric default 0.10
)
returns table(
  cutoff_date date, sample_size bigint, positives bigint, baseline_rate numeric,
  top_k_size bigint, top_k_positives bigint, precision_at_k numeric,
  recall_at_k numeric, false_positive_rate_at_k numeric, lift_at_k numeric
)
language sql stable set search_path to 'public'
as $function$
with prior as (
  select distinct on (pt.building_id)
    pt.building_id, pt.transaction_date as last_transaction_date
  from public.property_transactions pt
  where pt.building_id is not null
    and pt.category = 'A'
    and pt.transaction_date < p_cutoff
  order by pt.building_id, pt.transaction_date desc, pt.id
),
labeled as (
  select p.building_id, p.last_transaction_date,
    exists (
      select 1 from public.property_transactions f
      where f.building_id = p.building_id
        and f.category = 'A'
        and f.transaction_date >= p_cutoff
        and f.transaction_date < p_cutoff + p_horizon_days
    ) as did_transact
  from prior p
),
ranked as (
  select *, row_number() over (order by last_transaction_date asc, building_id) as rn,
    count(*) over () as n
  from labeled
),
agg as (
  select count(*)::bigint as n,
    count(*) filter (where did_transact)::bigint as positives,
    count(*) filter (where rn <= greatest(1, ceil(n * p_top_fraction)))::bigint as k,
    count(*) filter (where rn <= greatest(1, ceil(n * p_top_fraction)) and did_transact)::bigint as kp
  from ranked
)
select p_cutoff, n, positives,
  positives::numeric / nullif(n,0), k, kp,
  kp::numeric / nullif(k,0),
  kp::numeric / nullif(positives,0),
  (k-kp)::numeric / nullif(k,0),
  (kp::numeric / nullif(k,0)) / nullif(positives::numeric / nullif(n,0),0)
from agg;
$function$;
