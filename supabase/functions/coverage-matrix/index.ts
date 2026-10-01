import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
const headers={"Access-Control-Allow-Origin":"https://krikordecor-oss.github.io","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers});
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});
  const auth=req.headers.get("Authorization")||"";
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const uc=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const {data:{user}}=await uc.auth.getUser();
  if(!user)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers});

  const admin=createClient(url,service,{auth:{persistSession:false}});
  let body:any={};try{body=await req.json()}catch{}
  const country=body?.country_code?String(body.country_code).toUpperCase():null;

  let aq=admin.from("country_adapters").select("adapter_key,country_code,region_code,display_name,status,priority,coverage_identity,coverage_transactions,coverage_energy,coverage_planning,coverage_risk,notes");
  if(country)aq=aq.eq("country_code",country);
  const {data:adapters}=await aq.order("priority");

  let sq=admin.from("data_source_registry").select("source_key,country_code,category,legal_status,enabled,last_sync_at");
  if(country)sq=sq.eq("country_code",country);
  const {data:sources}=await sq;

  const out=(adapters||[]).map((a:any)=>{
    const ss=(sources||[]).filter((s:any)=>s.country_code===a.country_code);
    return {
      ...a,
      sources_total:ss.length,
      sources_approved:ss.filter((s:any)=>s.legal_status==="approved").length,
      sources_active:ss.filter((s:any)=>s.enabled&&s.legal_status==="approved").length
    };
  });
  return new Response(JSON.stringify({ok:true,adapters:out}),{headers});
});