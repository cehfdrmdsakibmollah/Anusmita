import {randomUUID} from "node:crypto";
import mongoose from "mongoose";
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {CatalogCategory,Audit} from "@/lib/models";
import {mediaDailyQuota} from "@/lib/cloudinary-server";
export const runtime="nodejs";
const MAX=3*1024*1024;
export async function POST(req:Request){
 let uploadedUrl:string|undefined;
 let base="";
 let headers:Record<string,string>={};
 try{
  assertOrigin(req);
  const actor=await authorize(["owner","admin","inventory"],"products.edit");
  const endpoint=process.env.R2_MEDIA_URL,secret=process.env.R2_MEDIA_SECRET;
  if(!endpoint||!secret||secret.length<32)throw new HttpError(503,"Category image storage is not configured");
  const configured=new URL(endpoint);
  if(configured.origin!=="https://anusmita-media.mdsakibmolla545.workers.dev"||configured.pathname!=="/"||configured.search||configured.hash)
    throw new HttpError(503,"Invalid R2 media configuration");
  base=configured.origin;headers={Authorization:"Bearer "+secret};
  const length=Number(req.headers.get("content-length"));
  if(!length||length>MAX+16384)throw new HttpError(413,"Category image must be under 3 MB");
  const form=await req.formData();
  const id=z.string().regex(/^[a-f0-9]{24}$/i).parse(form.get("categoryId"));
  const file=form.get("file");
  if(!(file instanceof File)||file.size<=0||file.size>MAX||!["image/png","image/jpeg","image/webp"].includes(file.type))
    throw new HttpError(400,"Choose a JPEG, PNG or WebP image under 3 MB");
  await db();
  const current=await CatalogCategory.findById(id).select("_id imageUrl").lean<any>();
  if(!current)throw new HttpError(404,"Category not found");
  await mediaDailyQuota(actor.id);
  const ext=file.type==="image/jpeg"?"jpg":file.type==="image/png"?"png":"webp";
  const key="public/categories/"+id+"/"+randomUUID()+"."+ext;
  uploadedUrl=base+"/"+key;
  const put=await fetch(uploadedUrl,{method:"PUT",headers:{...headers,"Content-Type":file.type,"Content-Length":String(file.size)},body:await file.arrayBuffer(),signal:AbortSignal.timeout(20000)});
  if(!put.ok)throw new HttpError(502,"Category image upload failed");
  const session=await mongoose.startSession();
  try{await session.withTransaction(async()=>{
   const changed=await CatalogCategory.updateOne({_id:id},{$set:{imageUrl:uploadedUrl}},{session,runValidators:true});
   if(!changed.matchedCount)throw new HttpError(404,"Category no longer exists");
   await Audit.create([{actorId:actor.id,action:"catalog.category.image_uploaded",entity:"CatalogCategory",entityId:id,details:{key,bytes:file.size,type:file.type}}],{session});
  });uploadedUrl=undefined;}finally{await session.endSession();}
  return Response.json({url:base+"/"+key},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){
  if(uploadedUrl&&base)await fetch(uploadedUrl,{method:"DELETE",headers,signal:AbortSignal.timeout(10000)}).catch(()=>{});
  return apiError(e);
 }
}
