import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
const headers={
  "Access-Control-Allow-Origin":"https://krikordecor-oss.github.io",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Content-Type":"application/json"
};
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers});
  if(req.method!=="POST") return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});

  const auth=req.headers.get("Authorization")||"";
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const uc=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const {data:{user}}=await uc.auth.getUser();
  if(!user) return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers});

  let body:any={};try{body=await req.json()}catch{}
  const country=body?.country_code?String(body.country_code).toUpperCase():null;
  const admin=createClient(url,service,{auth:{persistSession:false}});

  let q=admin.from("data_source_registry")
    .select("source_key,display_name,provider,country_code,category,update_frequency,legal_status,license_key,commercial_use_allowed,storage_allowed,redistribution_allowed,modification_allowed,attribution_required,personal_data_risk,cache_policy,attribution_text,reviewed_at,review_due_at,source_ingestion_policy(ingest_allowed,raw_storage_allowed,derived_storage_allowed,redistribute_raw_allowed,allowed_purposes,prohibited_fields,max_cache_days,requires_human_legal_review,policy_version)");
  if(country) q=q.eq("country_code",country);
  const {data:sources,error}=await q.order("country_code").order("source_key");
  if(error) return new Response(JSON.stringify({error:"rights_read_failed"}),{status:500,headers});

  let aq=admin.from("country_adapters").select("*");
  if(country) aq=aq.eq("country_code",country);
  const {data:adapters}=await aq.order("priority");

  return new Response(JSON.stringify({ok:true,country_code:country,sources:sources||[],adapters:adapters||[]}),{headers});
});