import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const headers={
  "Access-Control-Allow-Origin":"https://krikordecor-oss.github.io",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Content-Type":"application/json"
};

const n=(v:any)=>{const x=Number(v);return Number.isFinite(x)?x:null};
const prop=(o:any,...keys:string[])=>{for(const k of keys){if(o&&o[k]!=null&&o[k]!=="")return o[k]}return null};

async function rights(admin:any,sourceKey:string){
  const {data:p}=await admin.from("source_ingestion_policy")
    .select("ingest_allowed,derived_storage_allowed,attribution_required,attribution_template,requires_human_legal_review,policy_version")
    .eq("source_key",sourceKey).maybeSingle();
  const {data:s}=await admin.from("data_source_registry")
    .select("license_key,commercial_use_allowed,storage_allowed,redistribution_allowed,modification_allowed,attribution_text,reviewed_at")
    .eq("source_key",sourceKey).maybeSingle();
  if(!p?.ingest_allowed||!p?.derived_storage_allowed||p?.requires_human_legal_review) throw new Error("source_not_legally_approved:"+sourceKey);
  return {
    source:s,policy:p,
    snapshot:{
      commercial_use:s?.commercial_use_allowed??false,
      storage:s?.storage_allowed??false,
      redistribution:s?.redistribution_allowed??false,
      modification:s?.modification_allowed??false,
      attribution_required:p?.attribution_required??false,
      policy_version:p?.policy_version||"1.0"
    }
  };
}

async function upsertFact(admin:any,buildingId:string,sourceKey:string,sourceName:string,key:string,value:any,sourceRecordId:string|null,r:any,confidence=90){
  if(value==null||value==="")return;
  await admin.from("building_facts").delete().eq("building_id",buildingId).eq("fact_key",key).eq("source_key",sourceKey);
  await admin.from("building_facts").insert({
    building_id:buildingId,fact_key:key,value_json:{value},
    source_kind:"official",source_name:sourceName,source_record_id:sourceRecordId,
    confidence_score:confidence,last_verified_at:new Date().toISOString(),
    source_key:sourceKey,license_key:r.source?.license_key||null,
    attribution_text:r.policy?.attribution_template||r.source?.attribution_text||null,
    rights_snapshot:r.snapshot,rights_reviewed_at:r.source?.reviewed_at||null
  });
}

function bboxAround(lat:number,lon:number,meters=35){
  const dLat=meters/111320;
  const dLon=meters/(111320*Math.max(0.2,Math.cos(lat*Math.PI/180)));
  return [lon-dLon,lat-dLat,lon+dLon,lat+dLat];
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers});
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});
  const auth=req.headers.get("Authorization")||"";
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const uc=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const {data:{user}}=await uc.auth.getUser();
  if(!user)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers});

  let body:any={};try{body=await req.json()}catch{}
  const buildingId=String(body?.building_id||"");
  if(!buildingId)return new Response(JSON.stringify({error:"missing_building_id"}),{status:400,headers});

  const admin=createClient(url,service,{auth:{persistSession:false}});
  const {data:b}=await admin.from("buildings")
    .select("id,country_code,latitude,longitude,external_key,address_normalized,address_original")
    .eq("id",buildingId).maybeSingle();
  if(!b)return new Response(JSON.stringify({error:"building_not_found"}),{status:404,headers});

  const cc=String(b.country_code||"").toUpperCase();
  const lat=n(b.latitude),lon=n(b.longitude);
  if(lat==null||lon==null)return new Response(JSON.stringify({ok:true,state:"missing_coordinates"}),{headers});

  try{
    if(cc==="NL"){
      const r=await rights(admin,"nl-bag");
      const bb=bboxAround(lat,lon,40);
      const u=new URL("https://api.pdok.nl/kadaster/bag/ogc/v2/collections/pand/items");
      u.searchParams.set("f","json");u.searchParams.set("limit","20");u.searchParams.set("bbox",bb.join(","));
      const res=await fetch(u,{headers:{Accept:"application/geo+json","User-Agent":"HERIT-Lens/Global-1.0"}});
      if(!res.ok)throw new Error("nl_bag_"+res.status);
      const data=await res.json();
      const features=Array.isArray(data?.features)?data.features:[];
      const f=features[0]||null;
      if(!f)return new Response(JSON.stringify({ok:true,state:"no_match",country:"NL"}),{headers});
      const p=f.properties||{},rid=String(f.id||prop(p,"identificatie","id")||"");
      await upsertFact(admin,buildingId,"nl-bag","Kadaster / PDOK BAG","country_building_id",rid,rid,r,95);
      await upsertFact(admin,buildingId,"nl-bag","Kadaster / PDOK BAG","construction_year",prop(p,"oorspronkelijkBouwjaar","bouwjaar","originalConstructionYear"),rid,r,95);
      await upsertFact(admin,buildingId,"nl-bag","Kadaster / PDOK BAG","building_status",prop(p,"status","pandstatus"),rid,r,90);
      await upsertFact(admin,buildingId,"nl-bag","Kadaster / PDOK BAG","geometry_source","BAG OGC API",rid,r,100);
      await admin.from("audit_events").insert({actor_user_id:user.id,event_type:"global_enrichment",entity_type:"building",entity_id:buildingId,payload:{country:"NL",source:"nl-bag",record_id:rid}});
      return new Response(JSON.stringify({ok:true,state:"enriched",country:"NL",source:"nl-bag",facts:["country_building_id","construction_year","building_status","geometry_source"]}),{headers});
    }

    if(cc==="GB"){
      const r=await rights(admin,"gb-planning");
      const u=new URL("https://www.planning.data.gov.uk/entity.json");
      u.searchParams.set("latitude",String(lat));u.searchParams.set("longitude",String(lon));
      for(const d of ["listed-building","conservation-area","green-belt","flood-risk-zone","article-4-direction-area","tree-preservation-zone","brownfield-land"])u.searchParams.append("dataset",d);
      const res=await fetch(u,{headers:{Accept:"application/json","User-Agent":"HERIT-Lens/Global-1.0"}});
      if(!res.ok)throw new Error("gb_planning_"+res.status);
      const data=await res.json();
      const entities=Array.isArray(data?.entities)?data.entities:Array.isArray(data?.data)?data.data:[];
      const grouped:any={};
      for(const e of entities){const ds=String(e?.dataset||e?.typology||"unknown");(grouped[ds]??=[]).push(e);}
      const checks:[string,string][]=[
        ["listed-building","planning_listed_building"],
        ["conservation-area","planning_conservation_area"],
        ["green-belt","planning_green_belt"],
        ["flood-risk-zone","planning_flood_risk_zone"],
        ["article-4-direction-area","planning_article4"],
        ["tree-preservation-zone","planning_tree_preservation"],
        ["brownfield-land","planning_brownfield"]
      ];
      for(const [dataset,key] of checks)await upsertFact(admin,buildingId,"gb-planning","UK Planning Data",key,(grouped[dataset]||[]).length>0,null,r,90);
      await upsertFact(admin,buildingId,"gb-planning","UK Planning Data","planning_entity_count",entities.length,null,r,90);
      await admin.from("audit_events").insert({actor_user_id:user.id,event_type:"global_enrichment",entity_type:"building",entity_id:buildingId,payload:{country:"GB",source:"gb-planning",entities:entities.length}});
      return new Response(JSON.stringify({ok:true,state:"enriched",country:"GB",source:"gb-planning",planning_entities:entities.length}),{headers});
    }

    return new Response(JSON.stringify({ok:true,state:"adapter_not_active",country:cc}),{headers});
  }catch(e){
    const msg=e instanceof Error?e.message:String(e);
    return new Response(JSON.stringify({ok:false,error:msg,country:cc}),{status:502,headers});
  }
});