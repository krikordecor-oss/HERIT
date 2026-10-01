import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
const headers={"Access-Control-Allow-Origin":"https://krikordecor-oss.github.io","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers});
 if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});
 const auth=req.headers.get("Authorization")||"";
 const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 const uc=createClient(url,anon,{global:{headers:{Authorization:auth}}});
 const {data:{user}}=await uc.auth.getUser(); if(!user)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers});
 let body:any={};try{body=await req.json()}catch{}
 const category=String(body?.category||"other"),severity=String(body?.severity||"normal"),message=String(body?.message||"").trim();
 if(!message)return new Response(JSON.stringify({error:"message_required"}),{status:400,headers});
 const admin=createClient(url,service,{auth:{persistSession:false}});
 const {data,error}=await admin.from("test_feedback").insert({
   user_id:user.id,building_id:body?.building_id||null,category,severity,message,page:body?.page||null,
   app_version:body?.app_version||"2.1",device_info:body?.device_info||{},context:body?.context||{}
 }).select("id,created_at").single();
 if(error)return new Response(JSON.stringify({error:"feedback_failed"}),{status:500,headers});
 return new Response(JSON.stringify({ok:true,feedback:data}),{headers});
});