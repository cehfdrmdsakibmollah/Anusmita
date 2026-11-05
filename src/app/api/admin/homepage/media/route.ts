import {randomUUID} from "node:crypto";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {Audit} from "@/lib/models";
import {db} from "@/lib/db";
import {mediaDailyQuota} from "@/lib/cloudinary-server";
export const runtime="nodejs";
const MAX=3*1024*1024;
export async function POST(req:Request){
 try{
  assertOrigin(req);
  const actor=await authorize(["owner","admin"],"settings.edit");
  const length=Number(req.headers.get("content-length")||0);
  if(length<=0||length>MAX+16384)throw new HttpError(413,"Choose an image under 3 MB");
  const base=process.env.R2_MEDIA_URL,secret=process.env.R2_MEDIA_SECRET;
  if(!base||!secret||secret.length<32)throw new HttpError(503,"Homepage R2 media storage is not configured");
  const endpoint=new URL(base);
  if(endpoint.origin!=="https://anusmita-media.mdsakibmolla545.workers.dev"||endpoint.pathname!=="/"||endpoint.search||endpoint.hash)throw new HttpError(503,"Invalid R2 endpoint");
  const form=await req.formData();
  const file=form.get("file");
  if(!(file instanceof File)||!file.size||file.size>MAX||!["image/jpeg","image/png","image/webp"].includes(file.type))throw new HttpError(400,"Only JPEG, PNG and WebP images under 3 MB are supported");
  await db();
  await mediaDailyQuota(actor.id);
  const extension=file.type==="image/jpeg"?"jpg":file.type==="image/png"?"png":"webp";
  const key="public/homepage/"+randomUUID()+"."+extension;
  const url=endpoint.origin+"/"+key;
  const headers={Authorization:"Bearer "+secret};
  const uploaded=await fetch(url,{method:"PUT",headers:{...headers,"Content-Type":file.type,"Content-Length":String(file.size)},body:await file.arrayBuffer(),signal:AbortSignal.timeout(20000)});
  if(!uploaded.ok)throw new HttpError(uploaded.status===415?400:502,"R2 image upload failed");
  try{
   await Audit.create({actorId:actor.id,action:"homepage.media.upload",entity:"HomepageMedia",entityId:key,details:{key,type:file.type,bytes:file.size}});
  }catch{
   await fetch(url,{method:"DELETE",headers,signal:AbortSignal.timeout(10000)}).catch(()=>{});
   throw new HttpError(503,"Media audit failed; upload rolled back");
  }
  return Response.json({url,key},{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
