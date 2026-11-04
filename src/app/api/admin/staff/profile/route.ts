import mongoose from "mongoose";
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {User,Audit} from "@/lib/models";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const input=z.object({name:z.string().trim().min(2).max(100),phone:z.string().trim().max(32).regex(/^[+0-9 ()-]*$/),bio:z.string().trim().max(300)}).strict();
export async function GET(){
 try{
  const actor=await authorize(["owner","admin","sales","finance","inventory","purchasing","support","analyst"]);
  await db();
  const profile=await User.findById(actor.id).select("name email phone bio avatarUrl role active updatedAt").lean<any>();
  if(!profile)throw new HttpError(404,"Staff account not found");
  return Response.json({profile:{name:profile.name,email:profile.email,phone:profile.phone||"",bio:profile.bio||"",avatarUrl:profile.avatarUrl||"",role:profile.role,updatedAt:profile.updatedAt}},{headers:{"Cache-Control":"private,no-store"}});
 }catch(e){return apiError(e)}
}
export async function PATCH(request:Request){
 try{
  assertOrigin(request);
  const actor=await authorize(["owner","admin","sales","finance","inventory","purchasing","support","analyst"]);
  const value=input.parse(await request.json());
  await db();
  const session=await mongoose.startSession();
  try{await session.withTransaction(async()=>{
   const user=await User.findById(actor.id).session(session);
   if(!user||!user.active)throw new HttpError(403,"Staff account unavailable");
   const before={name:user.name,phone:user.phone||"",bio:user.bio||""};
   user.name=value.name;user.phone=value.phone;user.bio=value.bio;
   await user.save({session});
   await Audit.create([{actorId:actor.id,action:"staff.profile_updated",entity:"User",entityId:actor.id,details:{before,after:value}}],{session});
  })}finally{await session.endSession()}
  return Response.json({updated:true},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e)}
}