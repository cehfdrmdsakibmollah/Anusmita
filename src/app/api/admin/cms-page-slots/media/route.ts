import {randomUUID} from "node:crypto";
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {Audit} from "@/lib/models";
import {db} from "@/lib/db";
import {mediaDailyQuota} from "@/lib/cloudinary-server";
import {cmsSlotPages} from "@/lib/cms-page-slots";
export const runtime="nodejs";
const MAX=3*1024*1024;
const params=z.object({page:z.enum(cmsSlotPages)});
function r2Config(){
 const base=process.env.R2_MEDIA_URL,secret=process.env.R2_MEDIA_SECRET;
 if(!base||!secret||secret.length<32)throw new HttpError(503,"CMS media storage is not configured");
 const u=new URL(base);
 if(u.origin!=="https://anusmita-media.mdsakibmolla545.workers.dev"||u.pathname!=="/"||u.search||u.hash)throw new HttpError(503,"Invalid R2 endpoint");
 return {base:u.origin,headers:{Authorization:"Bearer "+secret}};
}
export async function POST(req:Request){
 try{
  assertOrigin(req);
  const actor=await authorize(["owner","admin"],"settings.edit");
  const length=Number(req.headers.get("content-length")||0);
  if(length<=0||length>MAX+16384)throw new HttpError(413,"Choose an image under 3 MB");
  const config=r2Config();
  const form=await req.formData();
  const {page}=params.parse({page:form.get("page")});
  const file=form.get("file");
  if(!(file instanceof File)||!file.size||file.size>MAX||!["image/jpeg","image/png","image/webp"].includes(file.type))throw new HttpError(400,"JPEG, PNG or WebP under 3 MB only");
  await mediaDailyQuota(actor.id);
  const extension=file.type==="image/jpeg"?"jpg":file.type==="image/png"?"png":"webp";
  const key="public/cms/"+page+"/"+randomUUID()+"."+extension;
  const url=config.base+"/"+key;
  const response=await fetch(url,{method:"PUT",headers:{...config.headers,"Content-Type":file.type,"Content-Length":String(file.size)},body:await file.arrayBuffer(),signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new HttpError(response.status===415?400:502,"CMS image upload rejected");
  try{
   await db();
   await Audit.create({actorId:actor.id,action:"cms.media.upload",entity:"CmsMedia",entityId:key,details:{page,key,type:file.type,bytes:file.size}});
  }catch{
   await fetch(url,{method:"DELETE",headers:config.headers,signal:AbortSignal.timeout(10000)}).catch(()=>{});
   throw new HttpError(503,"Media audit failed; upload rolled back");
  }
  return Response.json({url,key},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
