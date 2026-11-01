import {z} from "zod";
import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {SiteSeo,Audit} from "@/lib/models";
export const dynamic="force-dynamic";
const schema=z.object({title:z.string().trim().min(10).max(70),description:z.string().trim().min(30).max(160),enabled:z.boolean(),revision:z.number().int().nonnegative()}).strict();
export async function GET(){
 try{await authorize(["owner","admin"],"settings.view");await db();const d=await SiteSeo.findOne({key:"main"}).lean<any>();return Response.json({title:d?.title||"ANUSMITA | Fashion, Jewellery & Beauty",description:d?.description||"Discover curated fashion, jewellery and beauty at ANUSMITA.",enabled:d?.enabled||false,revision:d?.revision||0},{headers:{"Cache-Control":"private, no-store"}});}catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{assertOrigin(request);const actor=await authorize(["owner","admin"],"settings.edit");const data=schema.parse(await request.json());await db();const session=await mongoose.startSession();let revision=0;
 try{await session.withTransaction(async()=>{const old=await SiteSeo.findOne({key:"main"}).session(session);if((old?.revision||0)!==data.revision)throw new HttpError(409,"Settings changed; reload");
 const row=await SiteSeo.findOneAndUpdate({key:"main",revision:data.revision},{$set:{title:data.title,description:data.description,enabled:data.enabled},$inc:{revision:1}},{session,upsert:!old,new:true,runValidators:true});if(!row)throw new HttpError(409,"Concurrent update");revision=row.revision;
 await Audit.create([{actorId:actor.id,action:"site.seo.updated",entity:"SiteSeo",entityId:"main",details:{revision,enabled:data.enabled}}],{session});
 });}finally{await session.endSession();}
 return Response.json({saved:true,revision});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Concurrent setting update"},{status:409});return apiError(e);}
}
