import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import Papa from "https://esm.sh/papaparse@5.4.1";

const headers={"Content-Type":"application/json"};
const SOURCE="au-abs-building-approvals";
const FLOW="BA_LGA2025";

function norm(s:any){return String(s??"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"")}
function num(v:any){
  const s=String(v??"").trim().replace(/,/g,"");
  if(!s||["np","na","n.a.","-",".."].includes(s.toLowerCase()))return null;
  const x=Number(s);return Number.isFinite(x)?x:null;
}
function label(row:any,codeKey:string,labelKey:string){return String(row?.[labelKey]??row?.[codeKey]??"").trim()}
async function sha(s:string){
 const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
 return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
}

Deno.serve(async(req)=>{
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});
  const sb=Deno.env.get("SUPABASE_URL")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin=createClient(sb,service,{auth:{persistSession:false}});
  const supplied=req.headers.get("x-herit-sync-token")||"";
  const {data:secret}=await admin.from("sync_secrets").select("secret").eq("key","au_abs_cron").maybeSingle();
  if(!secret?.secret||secret.secret!==supplied)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers});

  let body:any={};try{body=await req.json()}catch{}
  const period=body?.period?String(body.period):null;

  const [{data:policy},{data:source}]=await Promise.all([
    admin.from("source_ingestion_policy").select("*").eq("source_key",SOURCE).maybeSingle(),
    admin.from("data_source_registry").select("*").eq("source_key",SOURCE).maybeSingle()
  ]);
  if(!policy?.ingest_allowed||policy?.requires_human_legal_review)
    return new Response(JSON.stringify({error:"source_not_legally_approved"}),{status:403,headers});

  const u=new URL("https://data.api.abs.gov.au/rest/data/ABS,"+FLOW+",/all");
  u.searchParams.set("dimensionAtObservation","AllDimensions");
  if(period){u.searchParams.set("startPeriod",period);u.searchParams.set("endPeriod",period);}
  else u.searchParams.set("lastNObservations","1");

  try{
    const r=await fetch(u,{
      headers:{
        "Accept":"application/vnd.sdmx.data+csv;labels=both",
        "Accept-Encoding":"gzip, deflate, br",
        "User-Agent":"Mozilla/5.0 HERIT-Lens/2.1"
      }
    });
    if(!r.ok)throw new Error("abs_api_"+r.status);
    const text=await r.text();
    const parsed=Papa.parse(text,{header:true,skipEmptyLines:true});
    const rows=(parsed.data||[]) as any[];
    const keys=(parsed.meta?.fields||[]) as string[];

    const regionCodeKey=keys.find(k=>/^REGION$/i.test(k))||keys.find(k=>/REGION.*CODE/i.test(k));
    const regionLabelKey=keys.find(k=>/^REGION_LABEL$/i.test(k))||keys.find(k=>/REGION.*LABEL/i.test(k))||regionCodeKey;
    const regionTypeKey=keys.find(k=>/^REGION_TYPE$/i.test(k));
    const timeKey=keys.find(k=>/^TIME_PERIOD$/i.test(k));
    const valueKey=keys.find(k=>/^OBS_VALUE$/i.test(k));
    const unitKey=keys.find(k=>/^UNIT_MEASURE$/i.test(k))||keys.find(k=>/^UNIT$/i.test(k));

    if(!regionCodeKey||!timeKey||!valueKey)
      return new Response(JSON.stringify({ok:false,error:"column_mapping_failed",headers:keys}),{status:422,headers});

    const dimKeys=keys.filter(k=>![
      "DATAFLOW","TIME_PERIOD","OBS_VALUE","OBS_STATUS","OBS_COMMENT","UNIT_MEASURE","UNIT_MULT","FREQ"
    ].includes(k.toUpperCase()) && !/_LABEL$/i.test(k) && k!==regionCodeKey && k!==regionTypeKey);

    const rightsSnapshot={
      commercial_use:source?.commercial_use_allowed??false,
      storage:source?.storage_allowed??false,
      redistribution:source?.redistribution_allowed??false,
      modification:source?.modification_allowed??false,
      attribution_required:policy?.attribution_required??true,
      policy_version:policy?.policy_version||"1.0"
    };

    const out:any[]=[];
    for(const row of rows){
      const region=String(row?.[regionCodeKey]??"").trim(); if(!region||region==="AUS")continue;
      const regionType=regionTypeKey?String(row?.[regionTypeKey]??"").trim():"LGA";
      if(regionType && !/LGA|local government/i.test(regionType))continue;
      const value=num(row?.[valueKey]); if(value==null)continue;
      const time=String(row?.[timeKey]??"").slice(0,7); if(!/^20\d{2}-\d{2}$/.test(time))continue;
      const dims=dimKeys.map(k=>String(row?.[k]??"").trim()).filter(Boolean);
      const metric="building_approvals."+dims.map(norm).filter(Boolean).join(".").slice(0,200);
      const recId=await sha([FLOW,region,time,...dims].join("|"));
      out.push({
        source_key:SOURCE,country_code:"AU",region_level:"LGA",region_code:region,
        region_name:label(row,regionCodeKey,regionLabelKey)||null,
        metric_key:metric||"building_approvals.value",period_start:time+"-01",period_end:null,
        value_numeric:value,value_text:null,unit:unitKey?String(row?.[unitKey]??"").trim()||null:null,
        source_record_id:recId,license_key:source?.license_key||null,
        attribution_text:policy?.attribution_template||source?.attribution_text||null,
        rights_snapshot:rightsSnapshot
      });
    }

    let upserted=0;
    for(let i=0;i<out.length;i+=500){
      const part=out.slice(i,i+500);
      const {error}=await admin.from("area_signals").upsert(part,{
        onConflict:"source_key,region_level,region_code,metric_key,period_start,source_record_id"
      });
      if(!error)upserted+=part.length;
    }
    await admin.from("data_source_registry").update({last_sync_at:new Date().toISOString()}).eq("source_key",SOURCE);
    return new Response(JSON.stringify({ok:true,status:"ingested",period:period||"latest",rows:rows.length,upserted,headers:keys}),{headers});
  }catch(e){
    const msg=e instanceof Error?e.message:String(e);
    return new Response(JSON.stringify({ok:false,error:msg}),{status:500,headers});
  }
});