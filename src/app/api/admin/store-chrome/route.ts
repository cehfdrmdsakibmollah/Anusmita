import {z} from "zod";
import mongoose from "mongoose";
import {authorize,apiError,assertOrigin,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {StoreChrome,Audit} from "@/lib/models";
export const dynamic="force-dynamic";
const schema=z.object({announcement:z.string().trim().max(180),footerNote:z.string().trim().max(240),enabled:z.boolean(),revision:z.number().int().nonnegative()}).strict();
export async function GET(){
 try{
  await authorize(["owner","admin"]);
  await db();
  const config=await StoreChrome.findOne({key:"main"}).select("announcement footerNote enabled revision").lean<any>();
  return Response.json({announcement:config?.announcement||"",footerNote:config?.footerNote||"",enabled:config?.enabled||false,revision:config?.revision||0},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{
  assertOrigin(request);
  const user=await authorize(["owner","admin"]);
  const input=schema.parse(await request.json());
  await db();
  const session=await mongoose.startSession();let nextRevision=0;
  try{await session.withTransaction(async()=>{
   const existing=await StoreChrome.findOne({key:"main"}).session(session);
   const current=existing?.revision||0;
   if(current!==input.revision)throw new HttpError(409,"Settings have changed; refresh before publishing.");
   const update=await StoreChrome.findOneAndUpdate({key:"main",revision:current},
     {$set:{announcement:input.announcement,footerNote:input.footerNote,enabled:input.enabled,lastEditedBy:user.id},$inc:{revision:1}},
     {upsert:!existing,new:true,session,runValidators:true});
   if(!update)throw new HttpError(409,"Concurrent update detected");
   nextRevision=update.revision;
   await Audit.create([{actorId:user.id,action:"storefront.chrome.updated",entity:"StoreChrome",entityId:"main",details:{enabled:input.enabled,revision:nextRevision}}],{session});
  });}finally{await session.endSession();}
  return Response.json({revision:nextRevision,saved:true},{headers:{"Cache-Control":"no-store"}});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Concurrent change: refresh and retry"},{status:409});return apiError(e);}
}
