import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const headers={
  "Access-Control-Allow-Origin":"https://krikordecor-oss.github.io",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Content-Type":"application/json"
};

const pick=(o:any,k:string)=>o && o[k]!==undefined && o[k]!==null && o[k]!=="" ? o[k] : null;
const fact=(building_id:string,key:string,value:any,sourceRecord:string,confidence=90)=>({
  building_id,fact_key:key,value_json:{value},
  source_kind:"official",source_name:"BDNB Open / CSTB",
  source_record_id:sourceRecord||null,confidence_score:confidence,
  last_verified_at:new Date().toISOString()
});

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
  const {data:rights}=await admin.from("source_ingestion_policy")
    .select("ingest_allowed,derived_storage_allowed,redistribute_raw_allowed,attribution_required,attribution_template,requires_human_legal_review,policy_version")
    .eq("source_key","bdnb").maybeSingle();
  const {data:sourceMeta}=await admin.from("data_source_registry")
    .select("license_key,commercial_use_allowed,storage_allowed,redistribution_allowed,modification_allowed,attribution_text,reviewed_at")
    .eq("source_key","bdnb").maybeSingle();
  const rightsSnapshot={
    commercial_use:sourceMeta?.commercial_use_allowed??false,
    storage:sourceMeta?.storage_allowed??false,
    redistribution:sourceMeta?.redistribution_allowed??false,
    modification:sourceMeta?.modification_allowed??false,
    attribution_required:rights?.attribution_required??false,
    policy_version:rights?.policy_version||"1.0"
  };
  if(!rights?.ingest_allowed || !rights?.derived_storage_allowed || rights.requires_human_legal_review){
    return new Response(JSON.stringify({error:"source_not_legally_approved"}),{status:403,headers});
  }
  const {data:b}=await admin.from("buildings")
    .select("id,country_code,ban_id,insee_code,address_normalized,address_original")
    .eq("id",buildingId).maybeSingle();

  if(!b)return new Response(JSON.stringify({error:"building_not_found"}),{status:404,headers});
  if(b.country_code!=="FR")return new Response(JSON.stringify({ok:true,state:"unsupported_country",facts:[]}),{headers});
  if(!b.insee_code)return new Response(JSON.stringify({ok:true,state:"missing_insee",facts:[]}),{headers});

  const base="https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet";
  let qs="code_commune_insee=eq."+encodeURIComponent(b.insee_code)+"&limit=3";
  if(b.ban_id) qs+="&cle_interop_adr_principale_ban=eq."+encodeURIComponent(b.ban_id);
  else {
    const adr=String(b.address_normalized||b.address_original||"").replace(/[*,]/g," ").trim();
    if(!adr)return new Response(JSON.stringify({ok:true,state:"missing_address",facts:[]}),{headers});
    qs+="&libelle_adr_principale_ban=ilike.*"+encodeURIComponent(adr)+"*";
  }

  let upstream:Response;
  try{upstream=await fetch(base+"?"+qs,{headers:{Accept:"application/json","User-Agent":"HERIT-Lens/1.7"}});}
  catch{return new Response(JSON.stringify({error:"bdnb_unreachable"}),{status:502,headers});}

  if(!upstream.ok){
    return new Response(JSON.stringify({error:"bdnb_error",status:upstream.status}),{status:502,headers});
  }
  const rows=await upstream.json();
  const row=Array.isArray(rows)?rows[0]:null;
  if(!row)return new Response(JSON.stringify({ok:true,state:"no_match",facts:[]}),{headers});

  const sourceRecord=String(pick(row,"batiment_groupe_id")||"");
  const candidates:[string,any,number][]=[
    ["dpe_class",pick(row,"classe_bilan_dpe"),95],
    ["dpe_ges_class",pick(row,"classe_emission_ges"),95],
    ["construction_year",pick(row,"annee_construction") ?? pick(row,"annee_construction_dpe"),85],
    ["dwelling_count",pick(row,"nb_log"),90],
    ["floor_count",pick(row,"nb_niveau"),85],
    ["footprint_surface_m2",pick(row,"surface_emprise_sol"),90],
    ["height_m",pick(row,"hauteur_mean"),85],
    ["building_usage",pick(row,"usage_principal_bdnb_open"),90],
    ["parcel_ids",pick(row,"l_parcelle_id"),95],
    ["median_property_value",pick(row,"valeur_fonciere_median"),80],
    ["last_sale_date",pick(row,"date_mutation") ?? pick(row,"date_mutation_dvf"),80]
  ];

  const rawLastSale=pick(row,"date_mutation") ?? pick(row,"date_mutation_dvf");
  if(rawLastSale){
    const year=Number(String(rawLastSale).slice(0,4));
    if(Number.isFinite(year)) candidates.push(["last_sale_year",year,80]);
  }

  const facts=candidates.filter(([,v])=>v!==null).map(([k,v,c])=>({
    ...fact(buildingId,k,v,sourceRecord,c as number),
    source_key:"bdnb",
    license_key:sourceMeta?.license_key||null,
    attribution_text:rights?.attribution_template||sourceMeta?.attribution_text||null,
    rights_snapshot:rightsSnapshot,
    rights_reviewed_at:sourceMeta?.reviewed_at||null
  }));
  for(const f of facts){
    await admin.from("building_facts").delete()
      .eq("building_id",buildingId).eq("fact_key",f.fact_key).eq("source_name","BDNB Open / CSTB");
  }
  if(facts.length){
    const {error}=await admin.from("building_facts").insert(facts);
    if(error)return new Response(JSON.stringify({error:"fact_write_failed"}),{status:500,headers});
  }

  await admin.from("audit_events").insert({
    actor_user_id:user.id,event_type:"building_enriched",entity_type:"building",entity_id:buildingId,
    payload:{source:"BDNB Open / CSTB",source_record_id:sourceRecord,facts:facts.map((f:any)=>f.fact_key)}
  });

  const compact:any={};
  for(const f of facts) compact[f.fact_key]=f.value_json.value;
  return new Response(JSON.stringify({
    ok:true,state:"enriched",source:"BDNB Open / CSTB",source_record_id:sourceRecord,
    quota_remaining:upstream.headers.get("x-quota-remaining"),
    facts:compact
  }),{headers});
});