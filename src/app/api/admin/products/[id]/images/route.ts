
import mongoose from "mongoose";
import {z} from "zod";
import {authorize,authorizePermission,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product,Audit} from "@/lib/models";
import {editGallery} from "@/lib/product-image-order";
export const runtime="nodejs";
const body=z.object({
 expectedUpdatedAt:z.iso.datetime({offset:true}),
 imageUrl:z.url().max(1200),
 action:z.enum(["cover","move-left","move-right","unlink"])
}).strict();
export async function PATCH(req:Request,ctx:{params:Promise<{id:string}>}){
 try{
  assertOrigin(req);
  const actor=await authorizePermission(["owner","admin","inventory"],"products.edit");
  const {id}=await ctx.params;
  if(!mongoose.isValidObjectId(id))throw new HttpError(400,"Invalid product ID");
  const data=body.parse(await req.json());
  await db();
  const session=await mongoose.startSession();let result:any;
  try{
   await session.withTransaction(async()=>{
    const product=await Product.findById(id).session(session);
    if(!product)throw new HttpError(404,"Product not found");
    if(new Date(product.updatedAt).getTime()!==new Date(data.expectedUpdatedAt).getTime())
      throw new HttpError(409,"Product changed since it was loaded; refresh before editing");
    let images:string[];
    try{images=editGallery(product.imageUrls||[],data.imageUrl,data.action);}
    catch(e){throw new HttpError(409,e instanceof Error?e.message:"Invalid gallery action");}
    if(JSON.stringify(images)!==JSON.stringify(product.imageUrls||[])){
      const updated=await Product.findOneAndUpdate({_id:product._id,updatedAt:product.updatedAt},{$set:{imageUrls:images}},{new:true,session,runValidators:true});
      if(!updated)throw new HttpError(409,"Concurrent image edit detected");
      await Audit.create([{actorId:actor.id,action:"product.gallery_"+data.action,entity:"Product",entityId:String(product._id),
        details:{imageUrl:data.imageUrl,keptFileInStorage:true}}],{session});
      result={sku:updated.sku,imageUrls:updated.imageUrls,updatedAt:updated.updatedAt};
    }else{
      result={sku:product.sku,imageUrls:product.imageUrls,updatedAt:product.updatedAt};
    }
   });
  }finally{await session.endSession();}
  return Response.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(error){return apiError(error);}
}
