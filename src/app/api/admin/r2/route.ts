import {randomUUID} from "node:crypto";
import mongoose from "mongoose";
import {z} from "zod";
import {authorize,authorizePermission,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product,Audit} from "@/lib/models";
import {mediaDailyQuota} from "@/lib/cloudinary-server";
export const runtime="nodejs";
const MAX=3*1024*1024;
const schema=z.object({productId:z.string().regex(/^[a-f0-9]{24}$/),expectedUpdatedAt:z.iso.datetime({offset:true})});
function settings(){
 const base=process.env.R2_MEDIA_URL,secret=process.env.R2_MEDIA_SECRET;
 if(!base||!secret||secret.length<32)throw new HttpError(503,"R2 storage is not configured");
 const u=new URL(base);
 if(u.origin!=="https://anusmita-media.mdsakibmolla545.workers.dev"||u.pathname!=="/"||u.search||u.hash)throw new HttpError(503,"Invalid R2 media endpoint");
 return {base:u.origin,headers:{Authorization:"Bearer "+secret}};
}
export async function GET(){
 try{
  await authorize(["owner","admin","inventory"],"products.view");
  const c=settings();const r=await fetch(c.base+"/health",{headers:c.headers,cache:"no-store",signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw new HttpError(503,"R2 storage check failed");
  return Response.json({ready:true,maxBytes:MAX},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(req:Request){
 let uploadedUrl:string|undefined,config:ReturnType<typeof settings>|undefined;
 try{
  assertOrigin(req);const actor=await authorize(["owner","admin","inventory"],"products.edit");
  config=settings();
  const contentLength=Number(req.headers.get("content-length"));
  if(!contentLength||contentLength>MAX+16384)throw new HttpError(413,"Upload a JPEG, PNG or WebP under 3 MB");
  const form=await req.formData();
  const input=schema.parse({productId:form.get("productId"),expectedUpdatedAt:form.get("expectedUpdatedAt")});
  const file=form.get("file");
  if(!(file instanceof File)||file.size<=0||file.size>MAX||!["image/png","image/jpeg","image/webp"].includes(file.type))throw new HttpError(400,"Choose a JPEG, PNG or WebP under 3 MB");
  await db();const p=await Product.findById(input.productId).select("updatedAt imageUrls").lean<any>();
  if(!p)throw new HttpError(404,"Product not found");
  if(new Date(p.updatedAt).getTime()!==new Date(input.expectedUpdatedAt).getTime())throw new HttpError(409,"Product changed; refresh before uploading");
  if(p.imageUrls?.length>=12)throw new HttpError(409,"Maximum 12 images per product");
  await mediaDailyQuota(actor.id);
  const ext=file.type==="image/jpeg"?"jpg":file.type==="image/png"?"png":"webp";
  const key="public/products/"+input.productId+"/"+randomUUID()+"."+ext;
  const url=config.base+"/"+key;
  const upload=await fetch(url,{method:"PUT",headers:{...config.headers,"Content-Type":file.type,"Content-Length":String(file.size)},body:await file.arrayBuffer(),signal:AbortSignal.timeout(20000)});
  if(!upload.ok)throw new HttpError(upload.status===415?400:502,upload.status===415?"File contents are not a supported image":"R2 upload failed; retry later");
  uploadedUrl=url;
  const session=await mongoose.startSession();let result:any;
  try{await session.withTransaction(async()=>{
   const product=await Product.findOneAndUpdate({_id:input.productId,updatedAt:new Date(input.expectedUpdatedAt),"imageUrls.11":{$exists:false}},{$push:{imageUrls:url}},{new:true,runValidators:true,session});
   if(!product)throw new HttpError(409,"Product changed during upload; refresh and retry");
   await Audit.create([{actorId:actor.id,action:"product.r2_upload",entity:"Product",entityId:input.productId,details:{key,bytes:file.size,type:file.type}}],{session});
   result={secureUrl:url,imageUrls:product.imageUrls,updatedAt:product.updatedAt,sku:product.sku};
  });uploadedUrl=undefined;}finally{await session.endSession();}
  return Response.json(result,{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){
  if(uploadedUrl&&config)await fetch(uploadedUrl,{method:"DELETE",headers:config.headers,signal:AbortSignal.timeout(10000)}).catch(()=>{});
  return apiError(e);
 }
}
