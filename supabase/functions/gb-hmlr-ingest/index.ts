import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import Papa from "https://esm.sh/papaparse@5.4.1";
const headers={"Content-Type":"application/json"};

function clean(v:any){return String(v??"").trim().replace(/^\{+|\}+$/g,"")}
function boolOldNew(v:any){const s=String(v??"").trim().toUpperCase();return s==="Y"?true:s==="N"?false:null}
function propertyType(v:any){return ({D:"detached",S:"semi_detached",T:"terraced",F:"flat",O:"other"} as any)[String(v??"").trim().toUpperCase()]||String(v??"").trim()||null}
function tenure(v:any){return ({F:"freehold",L:"leasehold"} as any)[String(v??"").trim().toUpperCase()]||String(v??"").trim()||null}
function parseDate(v:any){const s=String(v??"").trim();const m=s.match(/^(\d{4}-\d{2}-\d{2})/);return m?m[1]:null}

Deno.serve(async(req)=>{
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});
  const url=Deno.env.get("SUPABASE_URL")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin=createClient(url,service,{auth:{persistSession:false}});
  const supplied=req.headers.get("x-herit-sync-token")||"";
  const {data:secret}=await admin.from("sync_secrets").select("secret").eq("key","gb_hmlr_ingest").maybeSingle();
  if(!secret?.secret||secret.secret!==supplied)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers});

  const [{data:ppdPolicy},{data:uprnPolicy},{data:ppdSource},{data:uprnSource}] = await Promise.all([
    admin.from("source_ingestion_policy").select("*").eq("source_key","gb-hmlr-ppd").maybeSingle(),
    admin.from("source_ingestion_policy").select("*").eq("source_key","gb-hmlr-uprn").maybeSingle(),
    admin.from("data_source_registry").select("*").eq("source_key","gb-hmlr-ppd").maybeSingle(),
    admin.from("data_source_registry").select("*").eq("source_key","gb-hmlr-uprn").maybeSingle()
  ]);
  if(!ppdPolicy?.ingest_allowed||ppdPolicy?.requires_human_legal_review||!uprnPolicy?.ingest_allowed||uprnPolicy?.requires_human_legal_review)
    return new Response(JSON.stringify({error:"source_not_legally_approved"}),{status:403,headers});

  const {data:ppdArtifact}=await admin.from("source_artifacts")
    .select("*").eq("source_key","gb-hmlr-ppd").eq("artifact_kind","price_paid_csv")
    .in("status",["discovered","queued","processing"]).order("discovered_at",{ascending:false}).limit(1).maybeSingle();
  const {data:uprnArtifact}=await admin.from("source_artifacts")
    .select("*").eq("source_key","gb-hmlr-uprn").eq("artifact_kind","uprn_lookup_csv")
    .in("status",["discovered","processed"]).order("discovered_at",{ascending:false}).limit(1).maybeSingle();

  if(!ppdArtifact||!uprnArtifact)return new Response(JSON.stringify({ok:true,status:"noop",reason:"artifacts_missing"}),{headers});

  await admin.from("source_artifacts").update({status:"processing"}).eq("id",ppdArtifact.id);

  try{
    const [uRes,pRes]=await Promise.all([
      fetch(uprnArtifact.artifact_url,{headers:{"User-Agent":"HERIT-HMLR-Ingest/1.0"}}),
      fetch(ppdArtifact.artifact_url,{headers:{"User-Agent":"HERIT-HMLR-Ingest/1.0"}})
    ]);
    if(!uRes.ok||!pRes.ok)throw new Error("download_failed_"+uRes.status+"_"+pRes.status);
    const [uTxt,pTxt]=await Promise.all([uRes.text(),pRes.text()]);
    const uRows=(Papa.parse(uTxt,{skipEmptyLines:true}).data||[]) as any[][];
    const pRows=(Papa.parse(pTxt,{skipEmptyLines:true}).data||[]) as any[][];

    const uprnMap=new Map<string,string>();
    for(const row of uRows){
      const tx=clean(row?.[0]), uprn=clean(row?.[1]);
      if(!tx||!uprn||/transaction/i.test(tx)||!/^[0-9]+$/.test(uprn))continue;
      uprnMap.set(tx,uprn);
    }

    const offset=Number(ppdArtifact.row_cursor||0);
    const batchSize=5000;
    const slice=pRows.slice(offset,offset+batchSize);
    const rightsSnapshot={
      commercial_use:ppdSource?.commercial_use_allowed??false,
      storage:ppdSource?.storage_allowed??false,
      redistribution:false,
      modification:ppdSource?.modification_allowed??false,
      attribution_required:ppdPolicy?.attribution_required??true,
      policy_version:ppdPolicy?.policy_version||"1.0",
      restricted_fields:["postcode","paon","saon","street","locality","town","district","county"]
    };

    const txRows:any[]=[];
    for(const row of slice){
      if(!Array.isArray(row)||row.length<7)continue;
      const txid=clean(row[0]);
      if(!txid||/transaction/i.test(txid))continue;
      const price=Number(String(row[1]??"").replace(/,/g,""));
      const uprn=uprnMap.get(txid)||null;
      txRows.push({
        source_key:"gb-hmlr-ppd",source_transaction_id:txid,country_code:"GB",
        property_identifier_type:uprn?"UPRN":null,property_identifier:uprn,
        transaction_date:parseDate(row[2]),price_amount:Number.isFinite(price)?price:null,currency_code:"GBP",
        property_type:propertyType(row[4]),new_build:boolOldNew(row[5]),tenure_type:tenure(row[6]),
        category:String(row[14]??"").trim()||null,source_record_id:txid,
        license_key:ppdSource?.license_key||null,
        attribution_text:ppdPolicy?.attribution_template||ppdSource?.attribution_text||null,
        rights_snapshot:rightsSnapshot,updated_at:new Date().toISOString()
      });
    }

    let upserted=0;
    for(let i=0;i<txRows.length;i+=500){
      const part=txRows.slice(i,i+500);
      const {error}=await admin.from("property_transactions").upsert(part,{onConflict:"source_key,source_transaction_id"});
      if(!error)upserted+=part.length;
    }

    const idRows=[...new Set(txRows.filter(x=>x.property_identifier).map(x=>x.property_identifier))].map((uprn:any)=>({
      country_code:"GB",identifier_type:"UPRN",identifier_value:String(uprn),source_key:"gb-hmlr-uprn",
      license_key:uprnSource?.license_key||null,
      attribution_text:uprnPolicy?.attribution_template||uprnSource?.attribution_text||null,
      rights_snapshot:{
        commercial_use:uprnSource?.commercial_use_allowed??false,
        storage:uprnSource?.storage_allowed??false,
        redistribution:uprnSource?.redistribution_allowed??false,
        modification:uprnSource?.modification_allowed??false,
        attribution_required:uprnPolicy?.attribution_required??true,
        policy_version:uprnPolicy?.policy_version||"1.0"
      },
      last_seen_at:new Date().toISOString()
    }));
    for(let i=0;i<idRows.length;i+=500){
      await admin.from("property_identifiers").upsert(idRows.slice(i,i+500),{onConflict:"country_code,identifier_type,identifier_value,source_key"});
    }

    const next=offset+slice.length;
    const done=next>=pRows.length;
    await admin.from("source_artifacts").update({
      row_cursor:next,total_rows:pRows.length,status:done?"processed":"queued",
      processed_at:done?new Date().toISOString():null,
      metadata:{...(ppdArtifact.metadata||{}),matched_uprns:txRows.filter(x=>x.property_identifier).length,last_batch_rows:slice.length}
    }).eq("id",ppdArtifact.id);
    if(done)await admin.from("source_artifacts").update({status:"processed",processed_at:new Date().toISOString(),total_rows:uRows.length}).eq("id",uprnArtifact.id);

    return new Response(JSON.stringify({ok:true,status:done?"processed":"partial",offset,next,total:pRows.length,batch:slice.length,upserted,uprn_matches:txRows.filter(x=>x.property_identifier).length}),{headers});
  }catch(e){
    const msg=e instanceof Error?e.message:String(e);
    await admin.from("source_artifacts").update({status:"failed",metadata:{...(ppdArtifact.metadata||{}),error:msg}}).eq("id",ppdArtifact.id);
    return new Response(JSON.stringify({ok:false,error:msg}),{status:500,headers});
  }
});