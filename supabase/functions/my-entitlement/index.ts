import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
const headers={"Access-Control-Allow-Origin":"https://krikordecor-oss.github.io","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers});
 if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});
 const auth=req.headers.get("Authorization")||"";
 const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 const uc=createClient(url,anon,{global:{headers:{Authorization:auth}}});
 const {data:{user}}=await uc.auth.getUser(); if(!user)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers});
 const admin=createClient(url,service,{auth:{persistSession:false}});
 const {data:e}=await admin.from("user_entitlements").select("access_level,features,scan_limit,expires_at").eq("user_id",user.id).maybeSingle();
 const fallback={access_level:"free",features:[],scan_limit:10,expires_at:null};
 return new Response(JSON.stringify({ok:true,user_id:user.id,entitlement:e||fallback}),{headers});
});