
import {randomUUID} from "node:crypto";
import mongoose from "mongoose";
import {z} from "zod";
import {authorize,authorizePermission,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product} from "@/lib/models";
import {cloudinarySignature,uploadReceiptToken,supportedUpload} from "@/lib/cloudinary-signature";
import {mediaCredentials,mediaDailyQuota} from "@/lib/cloudinary-server";
export const runtime="nodejs";
const schema=z.object({productId:z.string().regex(/^[a-f0-9]{24}$/i),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
 fileSize:z.number().int().positive(),contentType:z.string().max(80)}).strict();
export async function POST(req:Request){
 try{
  assertOrigin(req);const actor=await authorizePermission(["owner","admin","inventory"],"products.edit");
  const data=schema.parse(await req.json());
  if(!supportedUpload(data.contentType,data.fileSize))throw new HttpError(400,"Choose a JPEG, PNG or WebP under 10 MB (convert HEIC first)");
  const creds=mediaCredentials();
  await db();const p=await Product.findById(data.productId).select("updatedAt imageUrls").lean<any>();
  if(!p)throw new HttpError(404,"Product not found");
  if(p.imageUrls?.length>=12)throw new HttpError(409,"Image gallery is full (12 max)");
  if(new Date(p.updatedAt).getTime()!==new Date(data.expectedUpdatedAt).getTime())
    throw new HttpError(409,"Product changed; refresh before uploading");
  await mediaDailyQuota(actor.id);
  const timestamp=Math.floor(Date.now()/1000);
  const publicId="anusmita/products/"+data.productId+"/"+randomUUID();
  const signature=cloudinarySignature({public_id:publicId,timestamp},creds.secret);
  const secret=process.env.SESSION_SECRET;
  if(!secret)throw new HttpError(503,"SESSION_SECRET missing");
  return Response.json({
   apiKey:creds.apiKey,cloudName:creds.cloud,publicId,timestamp,signature,
   uploadUrl:"https://api.cloudinary.com/v1_1/"+creds.cloud+"/image/upload",
   uploadToken:uploadReceiptToken(secret,actor.id,data.productId,publicId,timestamp,data.expectedUpdatedAt)
  },{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
