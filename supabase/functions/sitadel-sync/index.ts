import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import Papa from "https://esm.sh/papaparse@5.4.1";

const DATASET_ID = "6513f0189d7d312c80ec5b5b";
const DIDO_BASE = "https://data.statistiques.developpement-durable.gouv.fr/dido/api/v1";

const headers = {"Content-Type":"application/json"};

function norm(s:any){
  return String(s??"")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}
function firstKey(keys:string[], patterns:RegExp[]){
  for(const p of patterns){
    const k = keys.find(x=>p.test(norm(x)));
    if(k) return k;
  }
  return null;
}
function parseDate(v:any){
  if(v==null || v==="") return null;
  const s=String(v).trim();
  let m=s.match(/^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})/);
  if(m) return `${m[1]}-${m[2]}-${m[3]}`;
  m=s.match(/^(\d{2})[-\/]?(\d{2})[-\/]?(\d{4})/);
  if(m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}
function toInt(v:any){
  const n=Number(String(v??"").replace(",",".").replace(/\s/g,""));
  return Number.isFinite(n)?Math.trunc(n):null;
}
function toNum(v:any){
  const n=Number(String(v??"").replace(",",".").replace(/\s/g,""));
  return Number.isFinite(n)?n:null;
}
function parcels(v:any){
  if(v==null) return [];
  if(Array.isArray(v)) return v.map(String);
  return String(v).split(/[;,|\s]+/).map(x=>x.trim()).filter(x=>x.length>=6);
}
async function sha256(text:string){
  const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
function latestModified(dataset:any){
  const vals:string[]=[];
  if(dataset?.last_modified) vals.push(dataset.last_modified);
  for(const df of dataset?.datafiles||[]){
    if(df?.last_modified) vals.push(df.last_modified);
    for(const m of df?.millesimes||[]) if(m?.last_modified) vals.push(m.last_modified);
  }
  return vals.sort().at(-1)||null;
}
function latestMillesime(df:any){
  const ms=[...(df?.millesimes||[])];
  ms.sort((a,b)=>String(a?.millesime||"").localeCompare(String(b?.millesime||"")));
  return ms.at(-1)||{};
}
function describeColumns(m:any){
  const cols=m?.columns||[];
  return cols.map((c:any)=>({name:String(c?.name||""),description:String(c?.description||"")}));
}
function selectColumn(cols:any[], patterns:RegExp[]){
  const hay = cols.map(c=>({raw:c.name,search:norm(c.name+" "+c.description)}));
  for(const p of patterns){
    const x=hay.find(c=>p.test(c.search));
    if(x) return x.raw;
  }
  return null;
}
function rowValue(row:any,key:string|null){ return key?row?.[key]:null; }

Deno.serve(async(req)=>{
  if(req.method!=="POST") return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});

  const supabaseUrl=Deno.env.get("SUPABASE_URL")!;
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}});

  const supplied=req.headers.get("x-herit-sync-token")||"";
  const {data:secretRow}=await admin.from("sync_secrets").select("secret").eq("key","sitadel_cron").maybeSingle();
  if(!secretRow?.secret || supplied!==secretRow.secret){
    return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers});
  }

  let requestBody:any={}; try{requestBody=await req.json()}catch{}
  const requestedCommune = requestBody?.commune ? String(requestBody.commune).trim() : null;

  const runStart=new Date().toISOString();
  const {data:run}=await admin.from("source_sync_runs").insert({source_key:"sitadel",status:"running"}).select("id").single();
  const runId=run?.id;

  try{
    const dsRes=await fetch(DIDO_BASE+"/datasets?page=1&pageSize=all",{headers:{Accept:"application/json","User-Agent":"HERIT-SITADEL-Sync/1.0"}});
    if(!dsRes.ok) throw new Error("dido_catalog_"+dsRes.status);
    const catalog=await dsRes.json();
    const dataset=(catalog?.data||[]).find((d:any)=>String(d?.id)===DATASET_ID);
    if(!dataset) throw new Error("sitadel_dataset_not_found");

    const upstreamModified=latestModified(dataset);
    const {data:state}=await admin.from("source_sync_state").select("*").eq("source_key","sitadel").maybeSingle();

    const {data:communeRows}=await admin.from("buildings")
      .select("insee_code")
      .eq("country_code","FR")
      .not("insee_code","is",null)
      .order("insee_code",{ascending:true});

    const discoveredCommunes=[...new Set((communeRows||[]).map((x:any)=>String(x.insee_code)).filter(Boolean))];
    const allCommunes=requestedCommune?[requestedCommune]:discoveredCommunes;
    if(!allCommunes.length){
      await admin.from("source_sync_state").upsert({
        source_key:"sitadel",upstream_last_modified:upstreamModified,last_checked_at:runStart,last_success_at:runStart,
        last_status:"noop",last_error:null,last_rows_seen:0,last_rows_upserted:0,cursor_insee:null,updated_at:runStart
      });
      if(runId) await admin.from("source_sync_runs").update({status:"noop",finished_at:new Date().toISOString(),upstream_last_modified:upstreamModified}).eq("id",runId);
      return new Response(JSON.stringify({ok:true,status:"noop",reason:"no_active_communes"}),{headers});
    }

    let startIndex=0;
    if(state?.cursor_insee){
      const ix=allCommunes.findIndex(c=>c>state.cursor_insee);
      startIndex=ix>=0?ix:0;
    }
    const batch=allCommunes.slice(startIndex,startIndex+25);
    const wrapped = batch.length<25 || startIndex+25>=allCommunes.length;
    const shouldSkip = !requestedCommune && upstreamModified && state?.upstream_last_modified===upstreamModified && !state?.cursor_insee;
    if(shouldSkip){
      await admin.from("source_sync_state").upsert({
        source_key:"sitadel",upstream_last_modified:upstreamModified,last_checked_at:runStart,last_status:"noop",
        last_error:null,updated_at:runStart
      });
      if(runId) await admin.from("source_sync_runs").update({status:"noop",finished_at:new Date().toISOString(),upstream_last_modified:upstreamModified}).eq("id",runId);
      return new Response(JSON.stringify({ok:true,status:"noop",reason:"upstream_unchanged"}),{headers});
    }

    let rowsSeen=0,rowsUpserted=0,eventsUpserted=0;
    const details:any={files:[],communes:batch};

    for(const df of dataset?.datafiles||[]){
      const rid=String(df?.rid||"");
      if(!rid) continue;
      const m=latestMillesime(df);
      const cols=describeColumns(m);
      const communeCol=selectColumn(cols,[/code.*commune/,/commune.*code/,/code.*insee/,/insee.*commune/]);
      if(!communeCol) { details.files.push({rid,skipped:"no_commune_column"}); continue; }

      const authIdCol=selectColumn(cols,[/numero.*autorisation/,/num.*autorisation/,/numero.*dau/,/num.*dau/,/id.*autorisation/]);
      const authTypeCol=selectColumn(cols,[/type.*autorisation/,/nature.*autorisation/,/type.*dau/]);
      const addressCol=selectColumn(cols,[/adresse.*terrain/,/adresse/,/voie/]);
      const parcelCol=selectColumn(cols,[/parcelle/,/cadastre/]);
      const appDateCol=selectColumn(cols,[/date.*depot/,/depot.*date/]);
      const authDateCol=selectColumn(cols,[/date.*autorisation/,/date.*decision/,/date.*accord/]);
      const startDateCol=selectColumn(cols,[/date.*ouverture/,/ouverture.*chantier/,/date.*commencement/,/commencement.*travaux/]);
      const completeDateCol=selectColumn(cols,[/date.*achev/,/achevement/,/daact/]);
      const cancelDateCol=selectColumn(cols,[/date.*annul/,/annulation/]);
      const housingCol=selectColumn(cols,[/nombre.*logement/,/nb.*logement/,/logement.*cree/]);
      const floorAreaCol=selectColumn(cols,[/surface.*plancher/,/surface.*cree/,/surface.*logement/]);

      let fileSeen=0,fileUpsert=0;
      for(const insee of batch){
        const u=new URL(DIDO_BASE+"/datafiles/"+encodeURIComponent(rid)+"/csv");
        u.searchParams.set("withColumnName","true");
        u.searchParams.set("withColumnDescription","false");
        u.searchParams.set("withColumnUnit","false");
        u.searchParams.set(communeCol,"eq:"+insee);

        const csvRes=await fetch(u,{headers:{Accept:"text/csv","User-Agent":"HERIT-SITADEL-Sync/1.0"}});
        if(!csvRes.ok){ details.files.push({rid,insee,error:csvRes.status}); continue; }
        const csv=await csvRes.text();
        const parsed=Papa.parse(csv,{header:true,delimiter:";",skipEmptyLines:true});
        const rows=(parsed.data||[]) as any[];
        rowsSeen+=rows.length; fileSeen+=rows.length;

        const {data:buildings}=await admin.from("buildings")
          .select("id,address_normalized,address_original")
          .eq("insee_code",insee);

        const bIds=(buildings||[]).map((b:any)=>b.id);
        let factRows:any[]=[];
        if(bIds.length){
          const {data}=await admin.from("building_facts")
            .select("building_id,value_json")
            .in("building_id",bIds)
            .eq("fact_key","parcel_ids");
          factRows=data||[];
        }
        const parcelMap=new Map<string,string>();
        for(const f of factRows){
          const vals=parcels(f?.value_json?.value??f?.value_json);
          for(const p of vals) parcelMap.set(norm(p),String(f.building_id));
        }
        const addressMap=new Map<string,string>();
        for(const b of buildings||[]){
          for(const av of [b.address_normalized,b.address_original]){
            const na=norm(av); if(na) addressMap.set(na,String(b.id));
          }
        }

        for(const row of rows){
          const authId=String(rowValue(row,authIdCol)||"").trim();
          const address=String(rowValue(row,addressCol)||"").trim();
          const rowParcels=parcels(rowValue(row,parcelCol));
          let buildingId:string|null=null;
          for(const p of rowParcels){ const hit=parcelMap.get(norm(p)); if(hit){buildingId=hit;break;} }
          if(!buildingId && address){ buildingId=addressMap.get(norm(address))||null; }

          const rawKey=authId || await sha256(JSON.stringify(row));
          const applicationDate=parseDate(rowValue(row,appDateCol));
          const authorizationDate=parseDate(rowValue(row,authDateCol));
          const startDate=parseDate(rowValue(row,startDateCol));
          const completionDate=parseDate(rowValue(row,completeDateCol));
          const cancellationDate=parseDate(rowValue(row,cancelDateCol));
          const authorizationType=String(rowValue(row,authTypeCol)||df?.title||"").slice(0,120);

          const rec={
            source_dataset_id:DATASET_ID,source_datafile_rid:rid,source_record_key:rawKey,
            insee_code:insee,authorization_id:authId||null,authorization_type:authorizationType||null,
            address_text:address||null,parcel_ids:rowParcels,
            application_date:applicationDate,authorization_date:authorizationDate,start_date:startDate,
            completion_date:completionDate,cancellation_date:cancellationDate,
            housing_units:toInt(rowValue(row,housingCol)),floor_area_m2:toNum(rowValue(row,floorAreaCol)),
            raw_payload:row,upstream_last_modified:upstreamModified,updated_at:new Date().toISOString()
          };
          const {error:upErr}=await admin.from("sitadel_records").upsert(rec,{onConflict:"source_datafile_rid,source_record_key"});
          if(!upErr){rowsUpserted++;fileUpsert++;}

          if(buildingId && authId){
            const evs:any[]=[];
            if(applicationDate) evs.push(["application",applicationDate]);
            if(authorizationDate) evs.push(["authorized",authorizationDate]);
            if(startDate) evs.push(["started",startDate]);
            if(completionDate) evs.push(["completed",completionDate]);
            if(cancellationDate) evs.push(["cancelled",cancellationDate]);
            for(const [event_type,event_date] of evs){
              const evt={
                building_id:buildingId,external_authorization_id:authId,source_name:"SITADEL / SDES",
                authorization_type:authorizationType||null,event_type,event_date,status:null,
                housing_type:null,housing_units:rec.housing_units,floor_area_m2:rec.floor_area_m2,
                non_residential_area_m2:null,insee_code:insee,parcel_ids:rowParcels,raw_payload:row
              };
              const {error}=await admin.from("construction_events").upsert(evt,{
                onConflict:"source_name,external_authorization_id,event_type,event_date"
              });
              if(!error) eventsUpserted++;
            }
          }
        }
      }
      details.files.push({rid,title:df?.title||null,rows:fileSeen,upserts:fileUpsert,commune_column:communeCol});
    }

    const nextCursor=requestedCommune?null:(wrapped?null:batch.at(-1)||null);
    const status=requestedCommune?"success":(wrapped?"success":"partial");
    await admin.from("source_sync_state").upsert({
      source_key:"sitadel",upstream_last_modified:upstreamModified,last_checked_at:runStart,
      last_success_at:new Date().toISOString(),last_status:status,last_error:null,
      last_rows_seen:rowsSeen,last_rows_upserted:rowsUpserted,cursor_insee:nextCursor,updated_at:new Date().toISOString()
    });
    await admin.from("data_source_registry").update({last_sync_at:new Date().toISOString()}).eq("source_key","sitadel");
    if(runId) await admin.from("source_sync_runs").update({
      status,finished_at:new Date().toISOString(),upstream_last_modified:upstreamModified,
      communes_count:batch.length,rows_seen:rowsSeen,rows_upserted:rowsUpserted,events_upserted:eventsUpserted,details
    }).eq("id",runId);

    return new Response(JSON.stringify({ok:true,status,upstreamModified,communes:batch.length,rowsSeen,rowsUpserted,eventsUpserted,nextCursor}),{headers});
  }catch(e){
    const msg=e instanceof Error?e.message:String(e);
    await admin.from("source_sync_state").upsert({
      source_key:"sitadel",last_checked_at:runStart,last_status:"failed",last_error:msg,updated_at:new Date().toISOString()
    });
    if(runId) await admin.from("source_sync_runs").update({status:"failed",finished_at:new Date().toISOString(),error:msg}).eq("id",runId);
    return new Response(JSON.stringify({ok:false,error:msg}),{status:500,headers});
  }
});