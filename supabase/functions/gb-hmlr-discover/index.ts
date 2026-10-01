import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const headers={"Content-Type":"application/json"};
const PPD="https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads";
const UPRN="https://www.gov.uk/government/statistical-data-sets/transaction-unique-identifier-and-uprn-look-up-table-dataset";

function abs(base:string,href:string){try{return new URL(href,base).toString()}catch{return null}}
function links(html:string,base:string){
  const out:any[]=[];
  const re=/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while((m=re.exec(html))){
    const url=abs(base,m[1]); if(!url)continue;
    const label=m[2].replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
    out.push({url,label});
  }
  return out;
}
function csvs(items:any[]){return items.filter(x=>/\.csv(?:$|\?)/i.test(x.url)||/csv/i.test(x.label));}
function monthish(items:any[]){return items.filter(x=>/price-paid-data-(?:january|february|march|april|may|june|july|august|september|october|november|december)-20\d\d/i.test(x.url));}

Deno.serve(async(req)=>{
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});
  const url=Deno.env.get("SUPABASE_URL")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin=createClient(url,service,{auth:{persistSession:false}});
  const supplied=req.headers.get("x-herit-sync-token")||"";
  const {data:secret}=await admin.from("sync_secrets").select("secret").eq("key","gb_hmlr_cron").maybeSingle();
  if(!secret?.secret||secret.secret!==supplied)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers});

  const discovered:any[]=[];
  async function crawl(page:string,source_key:string,kind:string){
    const r=await fetch(page,{headers:{"User-Agent":"HERIT-HMLR-Discovery/1.0",Accept:"text/html"}});
    if(!r.ok)throw new Error("fetch_"+r.status+"_"+page);
    const html=await r.text();
    const ls=links(html,page);
    for(const x of csvs(ls))discovered.push({source_key,artifact_kind:kind,artifact_url:x.url,label:x.label,metadata:{page}});
    return ls;
  }

  try{
    const main=await crawl(PPD,"gb-hmlr-ppd","price_paid_csv");
    const months=monthish(main).slice(-4);
    for(const x of months){try{await crawl(x.url,"gb-hmlr-ppd","price_paid_csv")}catch{}}
    await crawl(UPRN,"gb-hmlr-uprn","uprn_lookup_csv");

    let upserts=0;
    for(const a of discovered){
      const {error}=await admin.from("source_artifacts").upsert(a,{onConflict:"source_key,artifact_url"});
      if(!error)upserts++;
    }
    return new Response(JSON.stringify({ok:true,discovered:discovered.length,upserted:upserts,artifacts:discovered.slice(0,20)}),{headers});
  }catch(e){
    const msg=e instanceof Error?e.message:String(e);
    return new Response(JSON.stringify({ok:false,error:msg}),{status:500,headers});
  }
});