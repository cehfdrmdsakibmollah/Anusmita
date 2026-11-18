import mongoose from "mongoose";
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {StoreSettings,StoreSettingsRevision,Audit} from "@/lib/models";
import {storeSettings} from "@/lib/store-settings";
const command=z.object({revision:z.number().int().nonnegative(),sourceRevision:z.number().int().positive()}).strict();
export async function POST(request:Request){
 try{
  assertOrigin(request);const actor=await authorize(["owner"],"settings.edit");
  const input=command.parse(await request.json());await db();
  const session=await mongoose.startSession();let output;
  try{await session.withTransaction(async()=>{
   const current=await StoreSettings.findOne({key:"main"}).session(session);
   if(!current||current.revision!==input.revision)throw new HttpError(409,"Settings changed. Reload before restoring.");
   const source=await StoreSettingsRevision.findOne({revision:input.sourceRevision}).session(session);
   if(!source)throw new HttpError(404,"Saved revision unavailable");
   const content=storeSettings.parse({...source.content,revision:current.revision+1});
   const result=await StoreSettings.updateOne({key:"main",revision:input.revision},{$set:{content,revision:content.revision}},{session});
   if(result.matchedCount!==1)throw new HttpError(409,"Concurrent settings update");
   await StoreSettingsRevision.create([{revision:content.revision,content,actorId:actor.id}],{session});
   await Audit.create([{actorId:actor.id,action:"store.settings.restored",entity:"StoreSettings",entityId:"main",details:{sourceRevision:input.sourceRevision,revision:content.revision}}],{session});
   output=content;
  });}finally{await session.endSession();}
  return Response.json(output,{headers:{"Cache-Control":"no-store"}});
 }catch(error){return apiError(error);}
}
