import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
const headers={"Access-Control-Allow-Origin":"https://krikordecor-oss.github.io","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
async function sha(s:string){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function bbox(lat:number,lon:number,r:number){
 const dLat=r/111320, dLon=r/(111320*Math.max(.2,Math.cos(lat*Math.PI/180)));
 return [lon-dLon,lat-dLat,lon+dLon,lat+dLat];
}
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers});
 if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});
 const auth=req.headers.get("Authorization")||"";
 const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 const uc=createClient(url,anon,{global:{headers:{Authorization:auth}}});
 const {data:{user}}=await uc.auth.getUser(); if(!user)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers});
 let body:any={};try{body=await req.json()}catch{}
 const lat=Number(body?.lat),lon=Number(body?.lon),radius=Math.max(25,Math.min(250,Number(body?.radius_m||80)));
 if(!Number.isFinite(lat)||!Number.isFinite(lon))return new Response(JSON.stringify({error:"invalid_coordinates"}),{status:400,headers});
 const admin=createClient(url,service,{auth:{persistSession:false}});
 const {data:rel}=await admin.from("global_reference_releases").select("release_id").eq("source_key","global-overture-buildings").order("release_date",{ascending:false}).limit(1).maybeSingle();
 if(!rel?.release_id)return new Response(JSON.stringify({error:"no_overture_release"}),{status:503,headers});
 const bb=bbox(lat,lon,radius), key=await sha(["global-overture-buildings",rel.release_id,...bb.map(x=>x.toFixed(6))].join("|"));
 const {data:existing}=await admin.from("global_zone_requests").select("*").eq("cache_key",key).maybeSingle();
 if(existing && existing.status==="ready" && (!existing.expires_at || new Date(existing.expires_at).getTime()>Date.now())){
   return new Response(JSON.stringify({ok:true,status:"ready",request_id:existing.id,result_count:existing.result_count,cache_key:key}),{headers});
 }
 const expires=new Date(Date.now()+7*86400000).toISOString();
 const {data,rowError}=await admin.from("global_zone_requests").upsert({
   source_key:"global-overture-buildings",requested_by:user.id,country_code:body?.country_code||null,bbox:bb,
   center_lat:lat,center_lon:lon,radius_m:radius,release_id:rel.release_id,status:"queued",cache_key:key,expires_at:expires
 },{onConflict:"cache_key"}).select("id,status").single();
 if(rowError)return new Response(JSON.stringify({error:"queue_failed"}),{status:500,headers});
 return new Response(JSON.stringify({ok:true,status:row.status,request_id:row.id,release_id:rel.release_id,cache_key:key,bbox:bb}),{headers});
});