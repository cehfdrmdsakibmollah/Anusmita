import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {StoreSettings,StoreSettingsRevision,Audit} from "@/lib/models";
import {defaultStoreSettings,storeSettings} from "@/lib/store-settings";
export async function GET(){
 try{
  await authorize(["owner","admin"],"settings.view");await db();
  const row=await StoreSettings.findOne({key:"main"}).lean<any>();
  const history=await StoreSettingsRevision.find({}).sort({revision:-1}).limit(10).select("revision createdAt").lean();
  return Response.json({settings:row?{...row.content,revision:row.revision}:defaultStoreSettings(process.env),history},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiError(error);}
}
export async function POST(request:Request){
 try{
  assertOrigin(request);const actor=await authorize(["owner"],"settings.edit");
  const data=storeSettings.parse(await request.json());await db();
  const session=await mongoose.startSession();
  try{await session.withTransaction(async()=>{
   const row=await StoreSettings.findOne({key:"main"}).session(session);
   if((row?.revision??0)!==data.revision)throw new HttpError(409,"Settings changed. Reload before saving.");
   const revision=data.revision+1;
   await StoreSettings.updateOne({key:"main",revision:data.revision},{$set:{content:{...data,revision},revision}},{upsert:!row,session});
   await StoreSettingsRevision.create([{revision,content:{...data,revision},actorId:actor.id}],{session});
   await Audit.create([{actorId:actor.id,action:"store.settings.updated",entity:"StoreSettings",entityId:"main",details:{revision}}],{session});
  });}finally{await session.endSession();}
  return Response.json({...data,revision:data.revision+1},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return apiError(error);}
}
