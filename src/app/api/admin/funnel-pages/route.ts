import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {FunnelPage,FunnelRevision,Audit} from "@/lib/models";
import {funnelWrite} from "@/lib/funnel-pages";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const readable=["owner","admin"] as const;
export async function GET(){
 try{
  await authorize([...readable],"settings.view");await db();
  const pages=await FunnelPage.find({}).sort({updatedAt:-1}).limit(200)
   .select("slug title description seoTitle noIndex endsAt blocks draftContent revision published archived publishedAt updatedAt")
   .lean<any[]>();
  return Response.json({pages:pages.map(p=>{
   const draft=p.draftContent&&typeof p.draftContent==="object"?p.draftContent:null;
   const current=draft||p;
   return {id:String(p._id),slug:p.slug,title:current.title,description:current.description||"",
    seoTitle:current.seoTitle||"",noIndex:!!current.noIndex,endsAt:current.endsAt?new Date(current.endsAt).toISOString():"",blocks:current.blocks||[],
    published:!!p.published,archived:!!p.archived,revision:p.revision,hasDraft:!!draft,updatedAt:p.updatedAt,publishedAt:p.publishedAt||null};
  })},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{
  assertOrigin(request);
  const actor=await authorize([...readable],"settings.edit");
  const data=funnelWrite.parse(await request.json());
  if(data.mode==="publish"&&data.content.blocks.some(b=>b.kind==="image"&&b.imageUrl&&!/^https:\/\//.test(b.imageUrl)&&!b.imageUrl.startsWith("/")))
   throw new HttpError(400,"Invalid image URL");
  await db();const session=await mongoose.startSession();let output:any=null;
  try{
   await session.withTransaction(async()=>{
    const existing=await FunnelPage.findOne({slug:data.slug}).session(session);
    if(Number(existing?.revision||0)!==data.revision)throw new HttpError(409,"Page modified by another editor. Reload to prevent overwriting");
    if(data.mode==="publish"&&existing?.archived)throw new HttpError(409,"Restore the archived page before publishing");
    if(data.mode==="archive"&&!existing)throw new HttpError(404,"Save the page before archiving");
    const publishedContent={title:data.content.title,description:data.content.description,seoTitle:data.content.seoTitle,
     noIndex:data.content.noIndex,endsAt:data.content.endsAt,blocks:data.content.blocks};
    const draftOnly=data.mode==="draft"&&!!existing?.published&&!existing?.archived;
    const update=data.mode==="archive"?{archived:true,published:false,draftContent:null,updatedBy:actor.id}:
      data.mode==="restore"?{archived:false,published:false,draftContent:publishedContent,updatedBy:actor.id}:
      draftOnly?{draftContent:publishedContent,updatedBy:actor.id}:
      {...publishedContent,endsAt:data.content.endsAt?new Date(data.content.endsAt):null,archived:false,published:data.mode==="publish",
       publishedAt:data.mode==="publish"?new Date():null,draftContent:null,updatedBy:actor.id};
    const saved=await FunnelPage.findOneAndUpdate({slug:data.slug,revision:data.revision},
     {$set:update,$inc:{revision:1}},{upsert:!existing,new:true,runValidators:true,session});
    if(!saved)throw new HttpError(409,"Concurrent editor update");
    await FunnelRevision.create([{slug:data.slug,revision:saved.revision,mode:data.mode,content:publishedContent,actorId:actor.id}],{session});
    await Audit.create([{actorId:actor.id,action:"funnel.page."+data.mode,entity:"FunnelPage",entityId:String(saved._id),
     details:{slug:data.slug,revision:saved.revision,mode:data.mode,draftOnly}}],{session});
    output={saved:true,revision:saved.revision,slug:data.slug,published:!!saved.published,archived:!!saved.archived};
   },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});
  }finally{await session.endSession();}
  return Response.json(output,{headers:{"Cache-Control":"no-store"}});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Duplicate funnel slug or concurrent edit"},{status:409});return apiError(e);}
}
