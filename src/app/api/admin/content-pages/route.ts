import {z} from "zod";
import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {ContentPage,Audit} from "@/lib/models";
export const dynamic="force-dynamic";
const slug=z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
const block=z.object({id:z.string().uuid(),type:z.enum(["heading","paragraph","callout","bullet","numbered","faq","quote","divider"]),text:z.string().trim().max(3000),textBn:z.string().trim().max(3000).optional(),answer:z.string().trim().max(3000).optional(),answerBn:z.string().trim().max(3000).optional()}).strict();
const schema=z.object({slug,title:z.string().trim().min(3).max(100),description:z.string().trim().max(160),titleBn:z.string().trim().max(120).optional(),descriptionBn:z.string().trim().max(160).optional(),seoTitle:z.string().trim().max(70).optional(),noIndex:z.boolean().optional(),archived:z.boolean().optional(),published:z.boolean(),mode:z.enum(["draft","publish","archive"]).optional(),revision:z.number().int().nonnegative(),blocks:z.array(block).min(1).max(30)}).strict().refine(x=>new Set(x.blocks.map(b=>b.id)).size===x.blocks.length,"Duplicate block IDs");
export async function GET(){
 try{await authorize(["owner","admin"],"settings.view");await db();const docs=await ContentPage.find({}).sort({updatedAt:-1}).limit(100).select("slug title titleBn description descriptionBn seoTitle noIndex archived published publishedAt revision blocks draftContent updatedAt").lean<any[]>();
 return Response.json({pages:docs.map(d=>{const draft=d.draftContent&&typeof d.draftContent==="object"?d.draftContent:null;const c=draft||d;return {id:String(d._id),slug:d.slug,title:c.title,description:c.description,titleBn:c.titleBn||"",descriptionBn:c.descriptionBn||"",seoTitle:c.seoTitle||"",noIndex:!!c.noIndex,archived:!!d.archived,published:!!d.published,hasDraft:!!draft,publishedAt:d.publishedAt||null,revision:d.revision,blocks:c.blocks,updatedAt:d.updatedAt};}),note:"Published pages appear under /pages/{slug}. No arbitrary HTML or scripts."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{assertOrigin(request);const actor=await authorize(["owner","admin"],"settings.edit");const data=schema.parse(await request.json());if(data.archived&&data.published)throw new HttpError(400,"Archived pages cannot be published");await db();const session=await mongoose.startSession();let revision=0;
 try{await session.withTransaction(async()=>{
 const existing=await ContentPage.findOne({slug:data.slug}).session(session);
 if(Number(existing?.revision||0)!==data.revision)throw new HttpError(409,"Page changed, refresh before saving");
 const mode=data.mode||(data.archived?"archive":data.published?"publish":"draft");
 const content={title:data.title,titleBn:data.titleBn||"",description:data.description,descriptionBn:data.descriptionBn||"",seoTitle:data.seoTitle||"",noIndex:!!data.noIndex,blocks:data.blocks};
 // Keep the published snapshot untouched when editing drafts.
 const draftOnly=mode==="draft"&&!!existing?.published&&!existing?.archived;
 const fields=mode==="archive"
  ?{archived:true,published:false,draftContent:null,updatedBy:actor.id}
  :draftOnly
   ?{draftContent:content,updatedBy:actor.id}
   :{...content,archived:false,published:mode==="publish",publishedAt:mode==="publish"?new Date():null,draftContent:null,updatedBy:actor.id};
 const updated=await ContentPage.findOneAndUpdate({slug:data.slug,revision:data.revision},
   {$set:fields,$inc:{revision:1}},{upsert:!existing,new:true,runValidators:true,session});
 if(!updated)throw new HttpError(409,"Concurrent edit");revision=updated.revision;
 await Audit.create([{actorId:actor.id,action:"content.page.updated",entity:"ContentPage",entityId:String(updated._id),details:{slug:data.slug,revision,mode,dataPublished:data.published,draftOnly}}],{session});
 });}finally{await session.endSession();}
 return Response.json({saved:true,revision});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Concurrent page edit or duplicate slug"},{status:409});return apiError(e);}
}
