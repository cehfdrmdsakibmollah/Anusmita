
import mongoose from "mongoose";
import {z} from "zod";
import {assertOrigin,authorize,authorizePermission,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product,Audit} from "@/lib/models";
import {productSchema} from "@/lib/validation";
export const runtime="nodejs";
const editable=productSchema.omit({onHand:true,sku:true}).partial();
const bodySchema=z.object({expectedUpdatedAt:z.iso.datetime({offset:true}),changes:editable}).strict()
 .refine(v=>Object.keys(v.changes).length>0,"No changes supplied");

export async function PATCH(req:Request,ctx:{params:Promise<{id:string}>}){
 try{
  assertOrigin(req);
  const actor=await authorize(["owner","admin","inventory"],"products.edit");
  const {id}=await ctx.params;
  if(!mongoose.isValidObjectId(id))throw new HttpError(400,"Invalid product ID");
  const {expectedUpdatedAt,changes}=bodySchema.parse(await req.json());
  await db();
  const session=await mongoose.startSession();let updated:any;
  try{
   await session.withTransaction(async()=>{
    updated=await Product.findOneAndUpdate({_id:id,updatedAt:new Date(expectedUpdatedAt)},{$set:changes},{session,new:true,runValidators:true});
    if(!updated)throw new HttpError(409,"Product was edited by someone else. Refresh and try again.");
    await Audit.create([{actorId:actor.id,action:"product.updated",entity:"Product",entityId:String(updated._id),details:{fields:Object.keys(changes)}}],{session});
   });
  }finally{await session.endSession();}
  return Response.json({id:String(updated._id),sku:updated.sku,updatedAt:updated.updatedAt});
 }catch(e:any){
  if(e?.code===11000)return Response.json({error:"Duplicate product slug"},{status:409});
  return apiError(e);
 }
}
