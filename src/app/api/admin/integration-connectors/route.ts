import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {IntegrationConnector,Audit} from "@/lib/models";
import mongoose from "mongoose";
export const dynamic="force-dynamic";
const category=z.enum(["Payment & COD","Courier & COD","Social Inbox","Customer messaging","Cloud & Storage","Marketing"]);
const id=z.string().regex(/^[a-f0-9]{24}$/i);
const data=z.object({
 name:z.string().trim().min(3).max(80),
 category,
 mode:z.enum(["sandbox","production"]).default("sandbox"),
 description:z.string().trim().max(400).default(""),
 webhookUrl:z.union([z.literal(""),z.string().url().max(300).refine(x=>{try{return new URL(x).protocol==="https:"}catch{return false}})]).default("")
}).strict();
const update=data.extend({id,enabled:z.boolean()}).strict();
const serialize=(v:any)=>({id:String(v._id),name:v.name,category:v.category,mode:v.mode,description:v.description,webhookUrl:v.webhookUrl,enabled:Boolean(v.enabled),createdAt:v.createdAt});
const safe=()=>({headers:{"Cache-Control":"private, no-store"}});
export async function GET(){
 try{await authorize(["owner","admin"],"settings.view");await db();
 const rows=await IntegrationConnector.find({archivedAt:null}).sort({createdAt:-1}).limit(150).lean<any[]>();
 return Response.json({connectors:rows.map(serialize)},safe())
 }catch(e){return apiError(e)}
}
export async function POST(req:Request){
 try{assertOrigin(req);const actor=await authorize(["owner","admin"],"settings.view");const body=data.parse(await req.json());await db();
 const slug="custom-"+new mongoose.Types.ObjectId().toString();
 const row=await IntegrationConnector.create({...body,slug,enabled:false,createdBy:actor.id,updatedBy:actor.id});
 await Audit.create({actorId:actor.id,action:"integrations.connector.created",entity:"IntegrationConnector",entityId:String(row._id),details:{name:body.name,mode:body.mode,category:body.category}});
 return Response.json({connector:serialize(row),message:"Connector metadata saved disabled; no API keys or live connection created"},{status:201,...safe()})
 }catch(e){return apiError(e)}
}
export async function PATCH(req:Request){
 try{assertOrigin(req);const actor=await authorize(["owner","admin"],"settings.view");const body=update.parse(await req.json());await db();
 const {_id,...unused}=body as any;void unused;
 const existing=await IntegrationConnector.findOne({_id:body.id,archivedAt:null});
 if(!existing)throw new HttpError(404,"Connector not found");
 if(body.enabled && body.mode==="production")throw new HttpError(409,"Production activation requires separately verified provider integration and cannot be enabled from the metadata registry");
 const row=await IntegrationConnector.findOneAndUpdate({_id:body.id,archivedAt:null},{$set:{name:body.name,category:body.category,mode:body.mode,description:body.description,webhookUrl:body.webhookUrl,enabled:body.enabled,updatedBy:actor.id}},{new:true,runValidators:true});
 await Audit.create({actorId:actor.id,action:"integrations.connector.updated",entity:"IntegrationConnector",entityId:body.id,details:{name:body.name,enabled:body.enabled,mode:body.mode}});
 return Response.json({connector:serialize(row)},safe());
 }catch(e){return apiError(e)}
}
export async function DELETE(req:Request){
 try{assertOrigin(req);const actor=await authorize(["owner","admin"],"settings.view");const query=id.parse(new URL(req.url).searchParams.get("id"));await db();
 const row=await IntegrationConnector.findOneAndUpdate({_id:query,archivedAt:null},{$set:{archivedAt:new Date(),enabled:false,updatedBy:actor.id}},{new:true});
 if(!row)throw new HttpError(404,"Connector not found");
 await Audit.create({actorId:actor.id,action:"integrations.connector.archived",entity:"IntegrationConnector",entityId:query,details:{name:row.name}});
 return Response.json({archived:true},safe())
 }catch(e){return apiError(e)}
}
