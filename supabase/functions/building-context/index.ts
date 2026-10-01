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
  const url=Deno.env.get("SUPABASE_URL")!;
  const anon=Deno.env.get("SUPABASE_ANON_KEY")!;
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const {data:{user},error:userError}=await userClient.auth.getUser();
  if(userError||!user) return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers});

  let body:any={}; try{body=await req.json()}catch{}
  const buildingId=String(body?.building_id||"");
  if(!buildingId) return new Response(JSON.stringify({error:"missing_building_id"}),{status:400,headers});

  const admin=createClient(url,service,{auth:{persistSession:false}});

  const [{data:building},{data:facts},{data:events},{data:construction},{data:components},{data:anchors},{data:transactions}] = await Promise.all([
    admin.from("buildings").select("id,external_key,country_code,primary_source,primary_source_id,address_normalized,address_original,locality,postal_code,latitude,longitude,updated_at").eq("id",buildingId).maybeSingle(),
    admin.from("building_facts").select("fact_key,value_json,source_kind,source_name,source_record_id,confidence_score,last_verified_at,created_at").eq("building_id",buildingId).order("created_at",{ascending:false}).limit(100),
    admin.from("building_events").select("event_type,event_date,occurred_at,title,summary,source_kind,source_name,source_record_id,confidence_score,evidence_json").eq("building_id",buildingId).eq("visibility","verified_public").order("created_at",{ascending:false}).limit(100),
    admin.from("construction_events").select("authorization_type,event_type,event_date,status,housing_type,housing_units,floor_area_m2,non_residential_area_m2,source_name,external_authorization_id").eq("building_id",buildingId).order("event_date",{ascending:false}).limit(50),
    admin.from("building_components").select("id,component_type,label,manufacturer,model,installed_on,removed_on,condition_status,lifecycle_status,source_kind,source_name,confidence_score").eq("building_id",buildingId).limit(100),
    admin.from("spatial_anchors").select("id,component_id,anchor_type,latitude,longitude,altitude_m,coordinate_frame,provider,confidence_score").eq("building_id",buildingId).eq("visibility","verified_public").limit(100),
    admin.from("property_transactions").select("source_transaction_id,transaction_date,price_amount,currency_code,property_type,tenure_type,new_build,property_identifier_type,property_identifier,source_key,license_key,attribution_text").eq("building_id",buildingId).order("transaction_date",{ascending:false}).limit(100)
  ]);

  if(!building) return new Response(JSON.stringify({error:"building_not_found"}),{status:404,headers});

  const safeFacts=(facts||[]).filter((f:any)=>![
    "alarm_location","access_code","occupancy_realtime","occupant_routine","vulnerable_entry"
  ].includes(String(f.fact_key)));

  const timeline:any[]=[];
  for(const e of events||[]) timeline.push({...e,kind:"herit_event"});
  for(const e of construction||[]) timeline.push({
    kind:"construction_event",
    event_type:e.event_type,event_date:e.event_date,title:e.authorization_type||e.event_type,
    summary:e.status||null,source_name:e.source_name,source_record_id:e.external_authorization_id,
    housing_type:e.housing_type,housing_units:e.housing_units,floor_area_m2:e.floor_area_m2
  });

  timeline.sort((a,b)=>String(b.occurred_at||b.event_date||"").localeCompare(String(a.occurred_at||a.event_date||"")));

  const context={
    schema_version:"herit-building-context/1.0",
    generated_at:new Date().toISOString(),
    building,
    facts:safeFacts,
    timeline,
    components:components||[],
    transactions:transactions||[],
    spatial_anchors:anchors||[],
    trust:{
      provenance_required:true,
      sensitive_fields_removed:true,
      public_spatial_anchors_only:true
    },
    capabilities:[
      "building.identity",
      "building.facts",
      "building.timeline",
      "building.components",
      "building.transactions",
      "building.spatial_context"
    ]
  };

  await admin.from("audit_events").insert({
    actor_user_id:user.id,event_type:"agent_context_read",entity_type:"building",entity_id:buildingId,
    payload:{schema_version:context.schema_version}
  });

  return new Response(JSON.stringify({ok:true,context}),{headers});
});