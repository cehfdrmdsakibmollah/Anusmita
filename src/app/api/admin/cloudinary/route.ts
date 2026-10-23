
import {authorize,apiError,assertOrigin,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product,Audit} from "@/lib/models";
import {validCloudinaryUrl} from "@/lib/cloudinary-media";
import mongoose from "mongoose";
import {z} from "zod";
const body=z.object({productId:z.string().regex(/^[0-9a-f]{24}$/i),url:z.url().max(600),expectedUpdatedAt:z.iso.datetime({offset:true})}).strict();
export async function POST(req:Request){
 try{
  assertOrigin(req);const actor=await authorize(["owner","admin","inventory"]);
  const data=body.parse(await req.json());
  if(!validCloudinaryUrl(data.url))throw new HttpError(400,"Only approved ANUSMITA Cloudinary image URLs accepted");
  await db();const session=await mongoose.startSession();let out:any;
  try{
   await session.withTransaction(async()=>{
    const product=await Product.findById(data.productId).session(session);
    if(!product)throw new HttpError(404,"Product not found");
    if(new Date(product.updatedAt).getTime()!==new Date(data.expectedUpdatedAt).getTime())throw new HttpError(409,"Product changed; refresh first");
    const urls=[...(product.imageUrls||[])];
    if(!urls.includes(data.url)){
     if(urls.length>=12)throw new HttpError(409,"Maximum 12 images per product");
     urls.push(data.url);product.imageUrls=urls;await product.save({session});
     await Audit.create([{actorId:actor.id,action:"product.cloudinary_image_linked",entity:"Product",entityId:String(product._id),details:{url:data.url}}],{session});
    }
    out={id:String(product._id),imageUrls:product.imageUrls,updatedAt:product.updatedAt};
   });
  }finally{await session.endSession();}
  return Response.json(out);
 }catch(err){return apiError(err);}
}
