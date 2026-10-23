
import "server-only";
import {randomUUID} from "node:crypto";
import mongoose from "mongoose";
import {db} from "@/lib/db";
import {Product,Audit,Counter} from "@/lib/models";
import {HttpError} from "@/lib/auth";
import {cloudinarySignature,managedAssetId,MAX_IMAGE_BYTES} from "@/lib/cloudinary-signature";

export function mediaCredentials(){
 const cloud=process.env.CLOUDINARY_CLOUD_NAME||"oseohmxd";
 const apiKey=process.env.CLOUDINARY_API_KEY;
 const secret=process.env.CLOUDINARY_API_SECRET;
 if(!/^[a-z0-9_-]{2,80}$/i.test(cloud)||!apiKey||!secret)
   throw new HttpError(503,"Cloudinary credentials are not configured on the server");
 return {cloud,apiKey,secret};
}
export async function mediaDailyQuota(userId:string){
 await db();
 const day=new Date().toISOString().slice(0,10);
 const raw=Number(process.env.MEDIA_DAILY_UPLOAD_LIMIT||"10");
 const cap=Math.max(1,Math.min(20,Number.isFinite(raw)?raw:10));
 try{
  const item=await Counter.findOneAndUpdate({key:"cloudinary-"+day+"-"+userId,value:{$lt:cap}},{$inc:{value:1}},{upsert:true,new:true});
  if(!item)throw new HttpError(429,"Daily image import quota reached");
 }catch(error:any){
  if(error?.code===11000)throw new HttpError(429,"Daily image import quota reached");
  throw error;
 }
}
export async function assetDetails(publicId:string){
 if(!managedAssetId(publicId))throw new HttpError(400,"Unrecognized ANUSMITA image ID");
 const c=mediaCredentials();
 const route=publicId.split("/").map(encodeURIComponent).join("/");
 const url="https://api.cloudinary.com/v1_1/"+c.cloud+"/resources/image/upload/"+route;
 const res=await fetch(url,{headers:{"Authorization":"Basic "+Buffer.from(c.apiKey+":"+c.secret).toString("base64")},cache:"no-store"});
 if(res.status===404)return null;
 if(!res.ok)throw new HttpError(502,"Unable to verify image at Cloudinary");
 const info:any=await res.json();
 if(info.public_id!==publicId||info.resource_type!=="image"||info.type!=="upload"||
    !Number.isFinite(info.bytes)||info.bytes>MAX_IMAGE_BYTES||info.bytes<=0||
    !["jpg","jpeg","png","webp","avif"].includes(String(info.format).toLowerCase())||
    !/^https:\/\/res\.cloudinary\.com\//.test(info.secure_url||""))
   throw new HttpError(400,"Uploaded media failed ANUSMITA verification");
 const u=new URL(info.secure_url);
 if(u.hostname!=="res.cloudinary.com"||!u.pathname.startsWith("/"+c.cloud+"/image/upload/"))
   throw new HttpError(400,"Cloudinary asset URL did not match the configured account");
 return {url:info.secure_url as string,bytes:info.bytes as number,format:info.format as string,publicId};
}
export async function uploadDriveAsset(publicId:string,driveId:string){
 const c=mediaCredentials();
 if(!managedAssetId(publicId))throw new HttpError(400,"Invalid destination asset ID");
 const source="https://drive.google.com/uc?export=download&id="+encodeURIComponent(driveId);
 const timestamp=Math.floor(Date.now()/1000);
 const params={public_id:publicId,timestamp};
 const form=new FormData();
 form.set("file",source);
 form.set("api_key",c.apiKey);
 form.set("public_id",publicId);
 form.set("timestamp",String(timestamp));
 form.set("signature",cloudinarySignature(params,c.secret));
 const response=await fetch("https://api.cloudinary.com/v1_1/"+c.cloud+"/image/upload",{method:"POST",body:form});
 if(!response.ok)throw new HttpError(502,"Google Drive import failed or Cloudinary could not access the source");
 return assetDetails(publicId);
}
export async function attachManagedAsset({productId,expectedUpdatedAt,actorId,publicId,replaceDriveId}:
 {productId:string;expectedUpdatedAt:string;actorId:string;publicId:string;replaceDriveId?:string}){
 const verified=await assetDetails(publicId);
 if(!verified)throw new HttpError(404,"Cloudinary image not found");
 await db();
 const session=await mongoose.startSession();let result:any;
 try{
  await session.withTransaction(async()=>{
   const product=await Product.findById(productId).session(session);
   if(!product)throw new HttpError(404,"Product not found");
   if(new Date(product.updatedAt).getTime()!==new Date(expectedUpdatedAt).getTime())
    throw new HttpError(409,"Product changed since it was loaded; refresh the product");
   const original:string[]=[...(product.imageUrls||[])];
   const driveUrl=replaceDriveId?"https://drive.google.com/thumbnail?id="+encodeURIComponent(replaceDriveId)+"&sz=w1200":null;
   const without=driveUrl?original.filter(x=>x!==driveUrl):original;
   const images=without.includes(verified.url)?without:[...without,verified.url];
   if(images.length>12)throw new HttpError(409,"Maximum 12 images per product");
   if(JSON.stringify(original)!==JSON.stringify(images)){
    product.imageUrls=images;await product.save({session});
    await Audit.create([{actorId,action:"product.cloudinary_verified_asset",entity:"Product",entityId:String(product._id),
      details:{publicId,bytes:verified.bytes,replacedDriveId:replaceDriveId||null}}],{session});
   }
   result={sku:product.sku,updatedAt:product.updatedAt,imageUrls:images,secureUrl:verified.url};
  });
 }finally{await session.endSession();}
 return result;
}
