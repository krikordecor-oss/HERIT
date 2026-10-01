import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type,x-herit-api-key","Access-Control-Allow-Methods":"GET,OPTIONS"}});
const now=()=>Date.now();
async function sha256(s:string){
  const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function val(v:any){return v&&typeof v==="object"&&"value" in v?v.value:v}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return json({ok:true});
  if(req.method!=="GET")return json({error:"method_not_allowed"},405);

  const started=now();
  const urlEnv=Deno.env.get("SUPABASE_URL")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin=createClient(urlEnv,service,{auth:{persistSession:false}});
  const key=req.headers.get("x-herit-api-key")||"";
  if(!key)return json({error:"missing_api_key"},401);

  const hash=await sha256(key);
  const prefix=key.slice(0,10);
  const {data:client}=await admin.from("enterprise_api_clients")
    .select("id,name,status,scopes,rate_limit_per_hour,allowed_countries,expires_at")
    .eq("client_key_prefix",prefix).eq("key_hash",hash).maybeSingle();

  if(!client||client.status!=="active")return json({error:"invalid_api_key"},401);
  if(client.expires_at && new Date(client.expires_at).getTime()<Date.now())return json({error:"api_key_expired"},401);
  if(!Array.isArray(client.scopes)||!client.scopes.includes("building:read"))return json({error:"scope_denied"},403);

  const oneHourAgo=new Date(Date.now()-3600000).toISOString();
  const {count}=await admin.from("enterprise_api_usage").select("id",{count:"exact",head:true}).eq("client_id",client.id).gte("requested_at",oneHourAgo);
  if((count||0)>=Number(client.rate_limit_per_hour||1000))return json({error:"rate_limit_exceeded"},429);

  const parts=new URL(req.url).pathname.split("/").filter(Boolean);
  const heritId=decodeURIComponent(parts[parts.length-1]||"");
  if(!/^HERIT-[A-Z0-9]+$/.test(heritId))return json({error:"invalid_herit_id"},400);

  const {data:building}=await admin.from("buildings")
    .select("id,herit_id,country_code,address_normalized,address_original,latitude,longitude,external_key,created_at,updated_at")
    .eq("herit_id",heritId).maybeSingle();
  if(!building)return json({error:"building_not_found"},404);

  if(Array.isArray(client.allowed_countries)&&client.allowed_countries.length&&!client.allowed_countries.includes(building.country_code)){
    return json({error:"country_not_allowed"},403);
  }

  const [{data:facts},{data:txs},{data:events},{data:construction},{data:ids}] = await Promise.all([
    admin.from("building_facts").select("fact_key,value_json,confidence_score,source_key,license_key,attribution_text,last_verified_at,rights_snapshot").eq("building_id",building.id),
    admin.from("property_transactions").select("transaction_date,price_amount,currency_code,property_type,tenure_type,new_build,property_identifier_type,property_identifier,source_key,license_key,attribution_text").eq("building_id",building.id).order("transaction_date",{ascending:false}).limit(100),
    admin.from("building_events").select("event_type,event_date,occurred_at,title,summary,source_kind,source_name,source_record_id,confidence_score,evidence").eq("building_id",building.id).eq("visibility","verified_public").order("occurred_at",{ascending:false}).limit(100),
    admin.from("construction_events").select("authorization_type,event_type,event_date,housing_units,floor_area_m2,source_name,source_key,license_key,attribution_text,rights_snapshot").eq("building_id",building.id).order("event_date",{ascending:false}).limit(100),
    admin.from("building_identifiers").select("provider,external_id,country_code,region_code,valid_from,valid_to,confidence_score,source_key").eq("building_id",building.id)
  ]);

  const sensitive=new Set(["owner_name","occupant_name","alarm_location","access_code","vacancy_status","occupancy_pattern","vulnerable_entry_point","security_system"]);
  const cleanFacts=(facts||[]).filter((f:any)=>!sensitive.has(String(f.fact_key))).map((f:any)=>({
    key:f.fact_key,value:val(f.value_json),confidence:f.confidence_score,source_key:f.source_key,
    license_key:f.license_key,attribution:f.attribution_text,last_verified_at:f.last_verified_at
  }));

  const body={
    schema:"herit-enterprise-building/1.0",
    herit_id:building.herit_id,
    building:{
      country_code:building.country_code,
      address:building.address_normalized||building.address_original||null,
      coordinates:{lat:building.latitude,lon:building.longitude},
      identifiers:ids||[]
    },
    facts:cleanFacts,
    transactions:txs||[],
    timeline:[...(events||[]),...(construction||[])],
    provenance:{
      source_count:[...new Set(cleanFacts.map((x:any)=>x.source_key).filter(Boolean))].length,
      generated_at:new Date().toISOString()
    }
  };

  await admin.from("enterprise_api_clients").update({last_used_at:new Date().toISOString()}).eq("id",client.id);
  await admin.from("enterprise_api_usage").insert({
    client_id:client.id,endpoint:"building",herit_id:heritId,country_code:building.country_code,
    response_status:200,response_ms:Date.now()-started,
    user_agent:req.headers.get("user-agent")||null,
    request_meta:{schema:"herit-enterprise-building/1.0"}
  });

  return json(body,200);
});