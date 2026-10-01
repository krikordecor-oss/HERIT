import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
const headers={
  "Access-Control-Allow-Origin":"https://krikordecor-oss.github.io",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Content-Type":"application/json"
};

const valueOf=(v:any)=>v&&typeof v==="object"&&"value" in v?v.value:v;
const yearFrom=(d:any)=>{const m=String(d||"").match(/^(\d{4})/);return m?Number(m[1]):null};
const fmtMoney=(v:any,c="EUR")=>{const n=Number(v);if(!Number.isFinite(n))return null;try{return new Intl.NumberFormat("fr-FR",{style:"currency",currency:c,maximumFractionDigits:0}).format(n)}catch{return String(Math.round(n))+" "+c}};

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
  const [{data:building},{data:facts},{data:score},{data:txs},{data:events},{data:construction}] = await Promise.all([
    admin.from("buildings").select("id,country_code,address_normalized,address_original,external_key").eq("id",buildingId).maybeSingle(),
    admin.from("building_facts").select("fact_key,value_json,confidence_score,source_key,last_verified_at").eq("building_id",buildingId),
    admin.from("opportunity_scores").select("score,score_state,confidence_score,reasons,computed_at").eq("building_id",buildingId).eq("vertical","real_estate").maybeSingle(),
    admin.from("property_transactions").select("transaction_date,price_amount,currency_code,property_type,tenure_type,new_build,source_key,property_identifier_type,property_identifier").eq("building_id",buildingId).order("transaction_date",{ascending:false}).limit(10),
    admin.from("building_events").select("event_type,event_date,occurred_at,title,summary,source_name,confidence_score").eq("building_id",buildingId).eq("visibility","verified_public").order("occurred_at",{ascending:false}).limit(10),
    admin.from("construction_events").select("authorization_type,event_type,event_date,housing_units,floor_area_m2,source_name").eq("building_id",buildingId).order("event_date",{ascending:false}).limit(10)
  ]);
  if(!building)return new Response(JSON.stringify({error:"building_not_found"}),{status:404,headers});

  const map=new Map<string,any>();
  for(const f of facts||[])map.set(String(f.fact_key),valueOf(f.value_json));

  const highlights:string[]=[];
  const cautions:string[]=[];
  const gaps:string[]=[];

  const dpe=map.get("dpe_class");
  if(dpe){
    const up=String(dpe).toUpperCase();
    highlights.push("Classe énergie "+up);
    if(["F","G"].includes(up))cautions.push("Performance énergétique faible");
    else if(["A","B"].includes(up))highlights.push("Bonne performance énergétique");
  } else gaps.push("Performance énergétique inconnue");

  const constructionYear=Number(map.get("construction_year"));
  if(Number.isFinite(constructionYear))highlights.push("Construction "+Math.trunc(constructionYear));
  else gaps.push("Année de construction inconnue");

  const flood=map.get("flood_zone");
  const sfha=String(map.get("special_flood_hazard_area")||"").toUpperCase();
  if(flood) {
    highlights.push("Zone inondation "+flood);
    if(sfha==="T"||sfha==="Y"||sfha==="YES")cautions.push("Zone spéciale de risque inondation");
  }

  const planningFlags=[
    ["planning_listed_building","Bâtiment protégé/classé"],
    ["planning_conservation_area","Zone de conservation"],
    ["planning_green_belt","Green Belt"],
    ["planning_article4","Article 4"],
    ["planning_flood_risk_zone","Zone de risque inondation"]
  ];
  for(const [k,label] of planningFlags)if(map.get(k)===true)cautions.push(label);

  const latestTx=(txs||[])[0];
  if(latestTx){
    const amount=fmtMoney(latestTx.price_amount,latestTx.currency_code||"EUR");
    highlights.push("Dernière transaction "+String(latestTx.transaction_date||"").slice(0,10)+(amount?" · "+amount:""));
  }else{
    const lastSaleDate=map.get("last_sale_date");
    if(lastSaleDate)highlights.push("Dernière mutation "+String(lastSaleDate).slice(0,10));
    else gaps.push("Historique de transaction incomplet");
  }

  const recentConstruction=(construction||[])[0];
  if(recentConstruction){
    highlights.push("Autorisation récente "+String(recentConstruction.authorization_type||recentConstruction.event_type||"").trim()+" · "+String(recentConstruction.event_date||"").slice(0,10));
  }

  const opportunity=score?.score_state==="computed" ? {
    score:Number(score.score),
    confidence:Number(score.confidence_score||0),
    reasons:Array.isArray(score.reasons)?score.reasons:[]
  } : null;

  if(!opportunity)gaps.push("Opportunity Score encore incomplet");

  const sourceSet=[...new Set((facts||[]).map((f:any)=>f.source_key).filter(Boolean))];
  const evidenceCount=(facts||[]).length+(txs||[]).length+(events||[]).length+(construction||[]).length;
  const completeness=Math.min(100,Math.round((Math.min((facts||[]).length,8)/8)*55 + (txs?.length?15:0) + ((events?.length||construction?.length)?15:0) + (opportunity?15:0)));

  const title=building.address_normalized||building.address_original||building.external_key||"Bâtiment";
  const summaryParts:string[]=[];
  if(opportunity)summaryParts.push("Opportunité "+Math.round(opportunity.score)+"/100");
  if(dpe)summaryParts.push("énergie "+String(dpe).toUpperCase());
  if(latestTx?.transaction_date)summaryParts.push("dernière vente "+yearFrom(latestTx.transaction_date));
  if(cautions.length)summaryParts.push(cautions.length+" point"+(cautions.length>1?"s":"")+" de vigilance");

  await admin.from("audit_events").insert({
    actor_user_id:user.id,event_type:"building_brief_read",entity_type:"building",entity_id:buildingId,
    payload:{country:building.country_code,evidence_count:evidenceCount,completeness}
  });

  return new Response(JSON.stringify({
    ok:true,
    schema_version:"herit-building-brief/1.0",
    building_id:buildingId,
    title,
    country_code:building.country_code,
    summary:summaryParts.join(" · ")||"Données encore insuffisantes pour un résumé décisionnel.",
    opportunity,
    highlights:highlights.slice(0,6),
    cautions:[...new Set(cautions)].slice(0,6),
    gaps:[...new Set(gaps)].slice(0,6),
    completeness,
    evidence_count:evidenceCount,
    sources:sourceSet,
    generated_at:new Date().toISOString()
  }),{headers});
});