import {z} from "zod";
import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {CatalogCategory,Product,Audit} from "@/lib/models";
export const dynamic="force-dynamic";
const id=z.string().regex(/^[a-f\d]{24}$/i);
const base=z.object({name:z.string().trim().min(2).max(90),slug:z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),parentId:id.nullable(),active:z.boolean(),position:z.number().int().min(0).max(99999),description:z.string().max(500),seoTitle:z.string().max(70),seoDescription:z.string().max(160)}).strict();
export async function GET(){
 try{await authorize(["owner","admin","inventory","purchasing"],"products.view");await db();
 const rows=await CatalogCategory.find({}).select("name slug parentId active position description seoTitle seoDescription").sort({position:1,name:1}).limit(500).lean<any[]>();
 return Response.json({categories:rows.map(x=>({id:String(x._id),name:x.name,slug:x.slug,parentId:x.parentId?String(x.parentId):null,active:x.active,position:x.position,description:x.description||"",seoTitle:x.seoTitle||"",seoDescription:x.seoDescription||""})),note:"Existing Product.category strings are unchanged; this is a new taxonomy registry, not yet a migration of storefront category routing."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{assertOrigin(request);const actor=await authorize(["owner","admin","inventory"],"products.edit");const data=base.parse(await request.json());await db();
 if(data.parentId&&!(await CatalogCategory.exists({_id:data.parentId})))throw new HttpError(400,"Parent category not found");
 const session=await mongoose.startSession();let result:any;
 try{await session.withTransaction(async()=>{const [doc]=await CatalogCategory.create([data],{session});result={id:String(doc._id)};await Audit.create([{actorId:actor.id,action:"catalog.category.created",entity:"CatalogCategory",entityId:result.id,details:{slug:data.slug}}],{session});});}finally{await session.endSession();}
 return Response.json(result,{status:201});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Category slug already exists"},{status:409});return apiError(e);}
}
export async function PATCH(request:Request){
 try{assertOrigin(request);const actor=await authorize(["owner","admin","inventory"],"products.edit");
 const data=base.extend({id}).parse(await request.json());await db();
 if(data.parentId===data.id)throw new HttpError(400,"Category cannot be its own parent");
 if(data.parentId){
  let ancestor:string|null=data.parentId;const seen=new Set<string>([data.id]);let depth=0;
  while(ancestor){if(seen.has(ancestor))throw new HttpError(409,"Category hierarchy cycle");seen.add(ancestor);if(++depth>50)throw new HttpError(409,"Hierarchy too deep");const parent=await CatalogCategory.findById(ancestor).select("parentId").lean<any>();if(!parent)throw new HttpError(404,"Parent not found");ancestor=parent.parentId?String(parent.parentId):null;}
 }
 const session=await mongoose.startSession();
 try{await session.withTransaction(async()=>{const updated=await CatalogCategory.updateOne({_id:data.id},{$set:{name:data.name,slug:data.slug,parentId:data.parentId,active:data.active,position:data.position,description:data.description,seoTitle:data.seoTitle,seoDescription:data.seoDescription}},{session,runValidators:true});if(!updated.matchedCount)throw new HttpError(404,"Category not found");
 await Audit.create([{actorId:actor.id,action:"catalog.category.updated",entity:"CatalogCategory",entityId:data.id,details:{slug:data.slug}}],{session});});}finally{await session.endSession();}
 return Response.json({updated:true});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Category slug exists"},{status:409});return apiError(e);}
}
export async function DELETE(request:Request){
 try{assertOrigin(request);const actor=await authorize(["owner","admin"],"products.edit");const data=z.object({id}).parse(await request.json());await db();
 const found=await CatalogCategory.findById(data.id).lean<any>();if(!found)throw new HttpError(404,"Category not found");
 if(await CatalogCategory.exists({parentId:data.id}))throw new HttpError(409,"Category has children; move them first");
 if(await Product.exists({category:{$in:[found.name,found.slug]}}))throw new HttpError(409,"Category is referenced by products");
 const session=await mongoose.startSession();
 try{await session.withTransaction(async()=>{await CatalogCategory.deleteOne({_id:data.id},{session});await Audit.create([{actorId:actor.id,action:"catalog.category.deleted",entity:"CatalogCategory",entityId:data.id,details:{slug:found.slug}}],{session});});}finally{await session.endSession();}
 return Response.json({deleted:true});
 }catch(e){return apiError(e);}
}
