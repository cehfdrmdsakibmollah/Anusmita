import mongoose from "mongoose";
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {SocialInbound,SocialConversationState,User,Audit} from "@/lib/models";
export const dynamic="force-dynamic";
const key=z.object({provider:z.enum(["messenger","instagram"]),senderId:z.string().trim().min(1).max(180)});
export async function GET(request:Request){
 try{await authorize(["owner","admin","support"],"support.view");const p=key.parse(Object.fromEntries(new URL(request.url).searchParams));await db();
 const state=await SocialConversationState.findOne(p).select("assignedAgentId priority status starred updatedAt").lean<any>();
 const agents=await User.find({active:true,role:{$in:["owner","admin","support"]}}).select("name role").limit(100).lean<any[]>();
 const first=await SocialInbound.findOne(p).sort({receivedAt:1}).select("receivedAt").lean<any>();
 return Response.json({state:state?{assignedAgentId:state.assignedAgentId?String(state.assignedAgentId):null,priority:state.priority,status:state.status,starred:state.starred}:null,
  agents:agents.map(a=>({id:String(a._id),name:a.name,role:a.role})),
  firstInboundAt:first?.receivedAt||null,
  firstResponseMinutes:null,
  slaNote:"No verified outbound timestamps; first-response SLA cannot yet be calculated."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e)}
}
const body=key.extend({assignedAgentId:z.union([z.string().regex(/^[a-f0-9]{24}$/i),z.null()]),priority:z.enum(["normal","high","urgent"]),status:z.enum(["open","pending","resolved"]),starred:z.boolean()}).strict();
export async function PATCH(request:Request){
 try{assertOrigin(request);const actor=await authorize(["owner","admin","support"],"support.view");const p=body.parse(await request.json());await db();
 const {provider,senderId,...changes}=p;
 if(!await SocialInbound.exists({provider,senderId}))throw new HttpError(404,"No recorded conversation");
 if(changes.assignedAgentId){const agent=await User.exists({_id:new mongoose.Types.ObjectId(changes.assignedAgentId),active:true,role:{$in:["owner","admin","support"]}});if(!agent)throw new HttpError(422,"Assignee is not an active support agent")}
 const state=await SocialConversationState.findOneAndUpdate({provider,senderId},{$set:{...changes,updatedBy:actor.id}},{upsert:true,new:true,runValidators:true});
 await Audit.create({actorId:actor.id,action:"social.conversation.triaged",entity:"SocialConversationState",entityId:String(state._id),details:{provider,priority:changes.priority,status:changes.status,starred:changes.starred,assignedAgentId:changes.assignedAgentId}});
 return Response.json({saved:true},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e)}
}
