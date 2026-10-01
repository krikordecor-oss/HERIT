import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
const headers={"Content-Type":"application/json"};
const BASE="https://www.abs.gov.au/statistics/industry/building-and-construction/building-approvals-australia/latest-release";

function links(html:string,base:string){
  const out:any[]=[]; const re=/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi; let m;
  while((m=re.exec(html))){
    try{
      const url=new URL(m[1],base).toString();
      const label=m[2].replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
      out.push({url,label});
    }catch{}
  }
  return out;
}

Deno.serve(async(req)=>{
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});
  const url=Deno.env.get("SUPABASE_URL")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin=createClient(url,service,{auth:{persistSession:false}});
  const supplied=req.headers.get("x-herit-sync-token")||"";
  const {data:secret}=await admin.from("sync_secrets").select("secret").eq("key","au_abs_cron").maybeSingle();
  if(!secret?.secret||secret.secret!==supplied)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers});

  try{
    const r=await fetch(BASE,{redirect:"follow",headers:{"User-Agent":"HERIT-AU-ABS-Discovery/1.0",Accept:"text/html"}});
    if(!r.ok)throw new Error("abs_latest_"+r.status);
    const page=r.url;
    const html=await r.text();
    const ls=links(html,page);
    const chosen=ls.filter((x:any)=>{
      if(!/\.zip(?:$|\?)/i.test(x.url)) return false;
      const hay=(x.label+" "+decodeURIComponent(x.url)).replace(/[_-]+/g," ");
      return /Local Government Area.*Australia/i.test(hay) ||
             /Statistical Area Level 2.*Australia/i.test(hay) ||
             /Dwellings approved for demolition/i.test(hay);
    });
    let upserted=0;
    const artifacts:any[]=[];
    for(const x of chosen){
      const hay=(x.label+" "+decodeURIComponent(x.url)).replace(/[_-]+/g," ");
      const kind=/Local Government Area/i.test(hay)?"lga_csv_zip":/Statistical Area Level 2/i.test(hay)?"sa2_csv_zip":"demolition_csv_zip";
      const a={source_key:"au-abs-building-approvals",artifact_kind:kind,artifact_url:x.url,label:x.label,period_label:x.label,metadata:{release_page:page}};
      const {error}=await admin.from("source_artifacts").upsert(a,{onConflict:"source_key,artifact_url"});
      if(!error)upserted++;
      artifacts.push(a);
    }
    return new Response(JSON.stringify({ok:true,release_page:page,discovered:artifacts.length,upserted,artifacts}),{headers});
  }catch(e){
    const msg=e instanceof Error?e.message:String(e);
    return new Response(JSON.stringify({ok:false,error:msg}),{status:500,headers});
  }
});