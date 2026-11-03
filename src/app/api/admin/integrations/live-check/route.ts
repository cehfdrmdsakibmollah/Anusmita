import {authorize,apiError} from "@/lib/auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Probe={id:string;state:"missing_credentials"|"verified_read_only"|"failed"|"not_supported";checkedAt:string|null;message:string;latencyMs:number|null};
function environmentReady(keys:string[]){return keys.every(k=>Boolean(process.env[k]));}
async function checkR2():Promise<Probe>{
 const id="r2";
 const base=process.env.R2_MEDIA_URL,secret=process.env.R2_MEDIA_SECRET;
 if(!base||!secret||secret.length<32)return{id,state:"missing_credentials",checkedAt:null,message:"R2 media secret or URL is missing/invalid. Redeploy after configuration.",latencyMs:null};
 const checkedAt=new Date().toISOString();
 let url:URL;
 try{url=new URL(base)}catch{return{id,state:"failed",checkedAt,message:"Invalid R2 media URL.",latencyMs:null}}
 if(url.origin!=="https://anusmita-media.mdsakibmolla545.workers.dev"||url.pathname!=="/"||url.search||url.hash)
  return{id,state:"failed",checkedAt,message:"R2 media URL does not match the application's allowed storage origin.",latencyMs:null};
 const start=performance.now();
 try{
  const res=await fetch(url.origin+"/health",{method:"GET",headers:{Authorization:"Bearer "+secret},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(7000)});
  return{id,state:res.ok?"verified_read_only":"failed",checkedAt,latencyMs:Math.round(performance.now()-start),message:res.ok?"R2 media Worker authenticated health endpoint responded successfully. Image upload/read delivery is not end-to-end tested.":"R2 Worker health check was rejected or unavailable. Verify Worker deployment and secret match."};
 }catch{return{id,state:"failed",checkedAt,latencyMs:Math.round(performance.now()-start),message:"R2 health probe timed out or could not reach the configured Worker."}}
}
async function check(id:"whatsapp"|"steadfast"):Promise<Probe>{
 const checkedAt=new Date().toISOString();
 const keys=id==="whatsapp"?["WHATSAPP_ACCESS_TOKEN","WHATSAPP_PHONE_NUMBER_ID"]:["STEADFAST_API_KEY","STEADFAST_SECRET_KEY"];
 if(!environmentReady(keys))return{id,state:"missing_credentials",checkedAt:null,message:"Required server credentials are missing. Redeploy after adding Netlify variables.",latencyMs:null};
 const start=performance.now();
 try{
  let ok=false;
  if(id==="whatsapp"){
   const phoneId=process.env.WHATSAPP_PHONE_NUMBER_ID!;
   if(!/^\d{6,30}$/.test(phoneId))return{id,state:"failed",checkedAt,message:"Invalid WhatsApp Phone Number ID format.",latencyMs:null};
   const version=/^v\d+\.0$/.test(process.env.META_GRAPH_API_VERSION||"")?process.env.META_GRAPH_API_VERSION:"v24.0";
   const res=await fetch("https://graph.facebook.com/"+version+"/"+encodeURIComponent(phoneId)+"?fields=id,display_phone_number",{
    headers:{Authorization:"Bearer "+process.env.WHATSAPP_ACCESS_TOKEN!,Accept:"application/json"},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(7000)});
   if(res.ok){const data=await res.json();ok=String(data?.id)===phoneId&&typeof data?.display_phone_number==="string";}
  }else{
   const res=await fetch("https://portal.packzy.com/api/v1/get_balance",{headers:{"Api-Key":process.env.STEADFAST_API_KEY!,"Secret-Key":process.env.STEADFAST_SECRET_KEY!,Accept:"application/json"},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(7000)});
   if(res.ok){const data=await res.json();ok=Number(data?.status)===200&&Number.isFinite(Number(data?.current_balance));}
  }
  return{id,state:ok?"verified_read_only":"failed",checkedAt,latencyMs:Math.round(performance.now()-start),message:ok?"Official read-only API response verified. This does not establish webhook subscription, outbound delivery, COD reconciliation or live operation.":"The official provider did not return the expected identity/status. Check permissions and credentials."};
 }catch{return{id,state:"failed",checkedAt,latencyMs:Math.round(performance.now()-start),message:"Read-only probe failed or timed out. No credentials were logged and no operational request was sent."}}
}
export async function GET(){
 try{
  await authorize(["owner","admin"],"settings.view");
  const results=await Promise.all([check("whatsapp"),check("steadfast"),checkR2()]);
  return Response.json({checks:results,automaticActivation:false,note:"WhatsApp, Steadfast and authenticated R2 Worker health are checked read-only. All other providers require specific approved verification."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e)}
}
