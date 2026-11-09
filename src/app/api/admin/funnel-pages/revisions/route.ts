import {z} from "zod";
import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {FunnelPage,FunnelRevision,Audit} from "@/lib/models";
import {funnelSlug,funnelContent} from "@/lib/funnel-pages";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const rollback=z.object({slug:funnelSlug,sourceRevision:z.number().int().positive(),currentRevision:z.number().int().positive()}).strict();
export async function GET(request:Request){
 try{
  await authorize(["owner","admin"],"settings.view");
  const slug=funnelSlug.parse(new URL(request.url).searchParams.get("slug"));
  await db();
  const versions=await FunnelRevision.find({slug}).sort({revision:-1}).limit(30)
   .select("revision mode createdAt actorId content").lean<any[]>();
  return Response.json({revisions:versions.map(r=>({revision:r.revision,mode:r.mode,createdAt:r.createdAt,
   title:r.content?.title||"",blockCount:Array.isArray(r.content?.blocks)?r.content.blocks.length:0}))},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{
  assertOrigin(request);const actor=await authorize(["owner","admin"],"settings.edit");
  const data=rollback.parse(await request.json());await db();
  const session=await mongoose.startSession();let nextRevision=0;
  try{
   await session.withTransaction(async()=>{
    const [page,source]=await Promise.all([
     FunnelPage.findOne({slug:data.slug,revision:data.currentRevision}).session(session).lean<any>(),
     FunnelRevision.findOne({slug:data.slug,revision:data.sourceRevision}).session(session).lean<any>()
    ]);
    if(!page)throw new HttpError(409,"Campaign changed. Reload before restoring.");
    if(!source)throw new HttpError(404,"Revision no longer available");
    const content=funnelContent.parse(source.content);
    const updated=await FunnelPage.findOneAndUpdate({slug:data.slug,revision:data.currentRevision},
     {$set:{draftContent:content,updatedBy:actor.id},$inc:{revision:1}},{session,new:true});
    if(!updated)throw new HttpError(409,"Concurrent edit");
    nextRevision=updated.revision;
    await FunnelRevision.create([{slug:data.slug,revision:nextRevision,mode:"rollback",content,actorId:actor.id}],{session});
    await Audit.create([{actorId:actor.id,action:"funnel.page.rollback",entity:"FunnelPage",entityId:String(updated._id),
     details:{slug:data.slug,sourceRevision:data.sourceRevision,newRevision:nextRevision,liveUnchanged:true}}],{session});
   },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});
  }finally{await session.endSession();}
  return Response.json({restoredAsDraft:true,revision:nextRevision},{headers:{"Cache-Control":"no-store"}});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Concurrent version update"},{status:409});return apiError(e);}
}
