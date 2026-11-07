import {validateProductSubcategory} from "@/lib/product-taxonomy-validation";

import mongoose from "mongoose";
import {z} from "zod";
import {assertOrigin,authorize,authorizePermission,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product,ProductSlugRedirect,Audit} from "@/lib/models";
import {productSchema} from "@/lib/validation";
import {publicationState,assertFutureSchedule} from "@/lib/publication-state";
import {validateCommercialState} from "@/lib/commercial-state";
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
  publicationState.parse(changes);
  assertFutureSchedule(changes.scheduledPublishAt);
  validateCommercialState(changes);
  if(changes.archived===true){changes.active=false;changes.scheduledPublishAt=null;}
  await db();
  if(Object.prototype.hasOwnProperty.call(changes,"subcategoryId")){
   const current=await Product.findById(id).select("category").lean<{category:string}|null>();
   if(!current)throw new HttpError(404,"Product not found");
   await validateProductSubcategory(changes.category||current.category,changes.subcategoryId);
  }
  const session=await mongoose.startSession();let updated:any;
  try{
   await session.withTransaction(async()=>{
    const prior=await Product.findOne({_id:id,updatedAt:new Date(expectedUpdatedAt)}).select("slug").session(session);
    if(!prior)throw new HttpError(409,"Product was edited by someone else. Refresh and try again.");
    const changedSlug=!!changes.slug&&changes.slug!==prior.slug;
    if(changedSlug&&await ProductSlugRedirect.exists({sourceSlug:changes.slug}).session(session))
     throw new HttpError(409,"This slug is reserved by an existing product redirect");
    updated=await Product.findOneAndUpdate({_id:id,updatedAt:new Date(expectedUpdatedAt)},{$set:changes},{session,new:true,runValidators:true});
    if(!updated)throw new HttpError(409,"Product was edited by someone else. Refresh and try again.");
    if(changedSlug){
     await ProductSlugRedirect.create([{sourceSlug:prior.slug,productId:updated._id,changedBy:actor.id}],{session});
     await Audit.create([{actorId:actor.id,action:"product.slug.redirect.created",entity:"ProductSlugRedirect",entityId:String(updated._id),details:{sourceSlug:prior.slug,targetSlug:updated.slug}}],{session});
    }
    await Audit.create([{actorId:actor.id,action:"product.updated",entity:"Product",entityId:String(updated._id),details:{fields:Object.keys(changes)}}],{session});
   });
  }finally{await session.endSession();}
  return Response.json({id:String(updated._id),sku:updated.sku,updatedAt:updated.updatedAt});
 }catch(e:any){
  if(e?.code===11000)return Response.json({error:"Duplicate product slug"},{status:409});
  return apiError(e);
 }
}
