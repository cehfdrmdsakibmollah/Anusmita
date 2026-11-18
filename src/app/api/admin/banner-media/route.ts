import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {BannerMedia,Audit} from "@/lib/models";
import {bannerMedia} from "@/lib/banner-media";
export async function GET(){
 try{
  await authorize(["owner","admin"],"settings.view");await db();
  const items=await BannerMedia.find({}).sort({updatedAt:-1}).limit(200).select("-_id -updatedBy -createdAt -updatedAt").lean();
  return Response.json({items},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiError(error);}
}
export async function POST(request:Request){
 try{
  assertOrigin(request);const actor=await authorize(["owner","admin"],"settings.edit");
  if(Number(request.headers.get("content-length")||0)>10000)throw new HttpError(413,"Banner settings too large");
  const data=bannerMedia.parse(await request.json());await db();
  const session=await mongoose.startSession();
  try{await session.withTransaction(async()=>{
   const old=await BannerMedia.findOne({id:data.id}).session(session);
   if((old?.revision??0)!==data.revision)throw new HttpError(409,"Campaign changed. Reload before saving.");
   await BannerMedia.updateOne({id:data.id,revision:data.revision},{$set:{...data,revision:data.revision+1,updatedBy:actor.id}},{upsert:!old,session});
   await Audit.create([{actorId:actor.id,action:"banner."+data.status,entity:"BannerMedia",entityId:data.id,details:{revision:data.revision+1,slot:data.slot}}],{session});
  });}finally{await session.endSession();}
  return Response.json({...data,revision:data.revision+1},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return apiError(error);}
}
