import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
const headers={"Content-Type":"application/json"};
const tokenKey=(fn:string)=>({
  "sitadel-sync":"sitadel_cron",
  "gb-hmlr-discover":"gb_hmlr_cron",
  "au-abs-ingest":"au_abs_cron",
  "overture-release-discover":"overture_release_cron"
} as Record<string,string>)[fn]||null;

Deno.serve(async(req)=>{
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});
  const sb=Deno.env.get("SUPABASE_URL")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin=createClient(sb,service,{auth:{persistSession:false}});
  const supplied=req.headers.get("x-herit-sync-token")||"";
  const {data:secret}=await admin.from("sync_secrets").select("secret").eq("key","sync_orchestrator").maybeSingle();
  if(!secret?.secret||secret.secret!==supplied)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers});

  const nowIso=new Date().toISOString();
  const {data:due,error}=await admin.from("source_sync_schedules")
    .select("*").eq("enabled",true).lte("next_run_at",nowIso).order("next_run_at").limit(10);
  if(error)return new Response(JSON.stringify({error:"schedule_read_failed"}),{status:500,headers});

  const results:any[]=[];
  for(const row of due||[]){
    const keyName=tokenKey(row.sync_function);
    if(!keyName){
      await admin.from("source_sync_schedules").update({last_run_at:nowIso,last_status:"failed",last_error:"missing_token_mapping",
        next_run_at:new Date(Date.now()+row.cadence_minutes*60000).toISOString()}).eq("source_key",row.source_key);
      results.push({source_key:row.source_key,status:"failed",reason:"missing_token_mapping"});
      continue;
    }
    const {data:t}=await admin.from("sync_secrets").select("secret").eq("key",keyName).maybeSingle();
    if(!t?.secret){
      await admin.from("source_sync_schedules").update({last_run_at:nowIso,last_status:"failed",last_error:"missing_secret",
        next_run_at:new Date(Date.now()+row.cadence_minutes*60000).toISOString()}).eq("source_key",row.source_key);
      results.push({source_key:row.source_key,status:"failed",reason:"missing_secret"});
      continue;
    }
    try{
      const endpoint=`${sb}/functions/v1/${row.sync_function}`;
      const r=await fetch(endpoint,{
        method:"POST",
        headers:{"Content-Type":"application/json","x-herit-sync-token":t.secret},
        body:JSON.stringify({trigger:"orchestrator",source_key:row.source_key,...(row.config||{})})
      });
      const text=await r.text();
      const status=r.ok?"success":"failed";
      await admin.from("source_sync_schedules").update({
        last_run_at:nowIso,last_status:status,last_error:r.ok?null:text.slice(0,500),
        next_run_at:new Date(Date.now()+row.cadence_minutes*60000).toISOString(),
        updated_at:new Date().toISOString()
      }).eq("source_key",row.source_key);
      results.push({source_key:row.source_key,function:row.sync_function,status,http_status:r.status});
    }catch(e){
      const msg=e instanceof Error?e.message:String(e);
      await admin.from("source_sync_schedules").update({
        last_run_at:nowIso,last_status:"failed",last_error:msg.slice(0,500),
        next_run_at:new Date(Date.now()+row.cadence_minutes*60000).toISOString()
      }).eq("source_key",row.source_key);
      results.push({source_key:row.source_key,status:"failed",reason:msg});
    }
  }

  return new Response(JSON.stringify({ok:true,checked_at:nowIso,due_count:(due||[]).length,results}),{headers});
});