import {z} from "zod";
import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {ContentPage,Audit} from "@/lib/models";
export const dynamic="force-dynamic";
const slug=z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
const block=z.object({id:z.string().uuid(),type:z.enum(["heading","paragraph","callout"]),text:z.string().trim().min(1).max(3000)}).strict();
const schema=z.object({slug,title:z.string().trim().min(3).max(100),description:z.string().trim().max(160),published:z.boolean(),revision:z.number().int().nonnegative(),blocks:z.array(block).min(1).max(30)}).strict().refine(x=>new Set(x.blocks.map(b=>b.id)).size===x.blocks.length,"Duplicate block IDs");
export async function GET(){
 try{await authorize(["owner","admin"],"settings.view");await db();const docs=await ContentPage.find({}).sort({updatedAt:-1}).limit(100).select("slug title description published revision blocks updatedAt").lean<any[]>();
 return Response.json({pages:docs.map(d=>({id:String(d._id),slug:d.slug,title:d.title,description:d.description,published:d.published,revision:d.revision,blocks:d.blocks,updatedAt:d.updatedAt})),note:"Published pages appear under /pages/{slug}. No arbitrary HTML or scripts."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{assertOrigin(request);const actor=await authorize(["owner","admin"],"settings.edit");const data=schema.parse(await request.json());await db();const session=await mongoose.startSession();let revision=0;
 try{await session.withTransaction(async()=>{
 const existing=await ContentPage.findOne({slug:data.slug}).session(session);
 if(Number(existing?.revision||0)!==data.revision)throw new HttpError(409,"Page changed, refresh before saving");
 const updated=await ContentPage.findOneAndUpdate({slug:data.slug,revision:data.revision},{$set:{title:data.title,description:data.description,blocks:data.blocks,published:data.published,updatedBy:actor.id},$inc:{revision:1}},{upsert:!existing,new:true,runValidators:true,session});
 if(!updated)throw new HttpError(409,"Concurrent edit");revision=updated.revision;
 await Audit.create([{actorId:actor.id,action:"content.page.updated",entity:"ContentPage",entityId:String(updated._id),details:{slug:data.slug,revision,published:data.published}}],{session});
 });}finally{await session.endSession();}
 return Response.json({saved:true,revision});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Concurrent page edit or duplicate slug"},{status:409});return apiError(e);}
}
