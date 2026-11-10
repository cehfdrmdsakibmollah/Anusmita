import {randomUUID} from "node:crypto";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {Audit} from "@/lib/models";
import {db} from "@/lib/db";
import {mediaDailyQuota} from "@/lib/cloudinary-server";
import {funnelSlug} from "@/lib/funnel-pages";
export const runtime="nodejs";
const MAX=3*1024*1024;
const MAX_FORM_OVERHEAD=32768;
function config(){
 const base=process.env.R2_MEDIA_URL,secret=process.env.R2_MEDIA_SECRET;
 if(!base||!secret||secret.length<32)throw new HttpError(503,"Funnel image uploads unavailable on this deployment: R2 media credentials are not configured. Preview deployments require separate upload credentials.");
 const url=new URL(base);
 if(url.origin!=="https://anusmita-media.mdsakibmolla545.workers.dev"||url.pathname!=="/"||url.search||url.hash)
  throw new HttpError(503,"Invalid R2 media endpoint");
 return {base:url.origin,headers:{Authorization:"Bearer "+secret}};
}
export async function GET(){
 try{
  await authorize(["owner","admin"],"settings.edit");
  const settings=config();
  const check=await fetch(settings.base+"/health",{method:"GET",headers:settings.headers,cache:"no-store",signal:AbortSignal.timeout(10000)});
  if(!check.ok)throw new HttpError(503,check.status===403?"Cloudflare R2 media secret does not match the Worker secret":"Cloudflare R2 storage health check failed");
  return Response.json({ready:true,maxBytes:MAX,formats:["image/jpeg","image/png","image/webp"]},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{
  assertOrigin(request);
  const actor=await authorize(["owner","admin"],"settings.edit");
  const length=Number(request.headers.get("content-length")||0);
  if(length>MAX+MAX_FORM_OVERHEAD)throw new HttpError(413,"Choose a JPG, PNG or WebP image under 3 MB");
  const settings=config();
  const form=await request.formData();
  const slug=funnelSlug.parse(form.get("slug"));
  const file=form.get("file");
  if(!(file instanceof File)||!file.size||file.size>MAX||!["image/jpeg","image/png","image/webp"].includes(file.type))
   throw new HttpError(400,"Upload a JPEG, PNG or WebP under 3 MB");
  await db();await mediaDailyQuota(actor.id);
  const ext=file.type==="image/jpeg"?"jpg":file.type==="image/png"?"png":"webp";
  const key="public/funnel/"+slug+"/"+randomUUID()+"."+ext;
  const url=settings.base+"/"+key;
  const response=await fetch(url,{method:"PUT",headers:{...settings.headers,"Content-Type":file.type,"Content-Length":String(file.size)},
   body:await file.arrayBuffer(),signal:AbortSignal.timeout(20000)});
  if(!response.ok){
   if(response.status===404)throw new HttpError(502,"Funnel image path is not permitted by the deployed Cloudflare R2 Worker. Deploy the updated Worker with the funnel media namespace.");
   if(response.status===403)throw new HttpError(503,"Cloudflare R2 upload authorization failed. Check Worker UPLOAD_SECRET and Netlify R2_MEDIA_SECRET.");
   if(response.status===413)throw new HttpError(413,"R2 rejected the image size. Use a file smaller than 3 MB.");
   if(response.status===415)throw new HttpError(400,"Image contents do not match JPEG, PNG or WebP. Re-export the image and retry.");
   if(response.status===429)throw new HttpError(429,"R2 upload is rate limited. Retry later.");
   throw new HttpError(502,"R2 Worker upload failed (HTTP "+response.status+").");
  }
  try{
   await Audit.create({actorId:actor.id,action:"funnel.media.upload",entity:"FunnelMedia",entityId:key,
    details:{slug,key,type:file.type,bytes:file.size}});
  }catch{
   await fetch(url,{method:"DELETE",headers:settings.headers,signal:AbortSignal.timeout(10000)}).catch(()=>{});
   throw new HttpError(503,"Media audit failed. Upload rolled back");
  }
  return Response.json({url,key},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
