import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
const headers={"Content-Type":"application/json"};
const PAGE="https://docs.overturemaps.org/guides/buildings/";

Deno.serve(async(req)=>{
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});
  const sb=Deno.env.get("SUPABASE_URL")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin=createClient(sb,service,{auth:{persistSession:false}});
  const supplied=req.headers.get("x-herit-sync-token")||"";
  const {data:secret}=await admin.from("sync_secrets").select("secret").eq("key","overture_release_cron").maybeSingle();
  if(!secret?.secret||secret.secret!==supplied)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers});
  try{
    const r=await fetch(PAGE,{headers:{"User-Agent":"HERIT-Overture-Release/1.0",Accept:"text/html"}});
    if(!r.ok)throw new Error("overture_docs_"+r.status);
    const html=await r.text();
    const matches=[...html.matchAll(/release\/(20\d{2}-\d{2}-\d{2}(?:\.\d+)?)/g)].map(m=>m[1]);
    const release=[...new Set(matches)].sort().reverse()[0]||null;
    if(!release)return new Response(JSON.stringify({ok:false,error:"release_not_found"}),{status:502,headers});
    const date=release.slice(0,10);
    await admin.from("global_reference_releases").upsert({
      source_key:"global-overture-buildings",
      release_id:release,
      release_date:date,
      source_url:`https://overturemapswestus2.blob.core.windows.net/release/${release}/theme=buildings/type=building/`,
      metadata:{
        theme:"buildings",
        type:"building",
        aws:`s3://overturemaps-us-west-2/release/${release}/theme=buildings/type=building/*`,
        azure:`https://overturemapswestus2.blob.core.windows.net/release/${release}/theme=buildings/type=building/*`
      }
    },{onConflict:"source_key,release_id"});
    await admin.from("data_source_registry").update({last_sync_at:new Date().toISOString()}).eq("source_key","global-overture-buildings");
    return new Response(JSON.stringify({ok:true,release_id:release,release_date:date}),{headers});
  }catch(e){
    const msg=e instanceof Error?e.message:String(e);
    return new Response(JSON.stringify({ok:false,error:msg}),{status:500,headers});
  }
});