import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError,PERMISSIONS,encodePermissionKey,decodePermissionMap} from "@/lib/auth";
import {db} from "@/lib/db";
import {User,Audit} from "@/lib/models";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const STAFF=["admin","sales","finance","inventory","purchasing","support","analyst"] as const;
const permissionsSchema=z.partialRecord(z.enum(PERMISSIONS),z.boolean()).default({});
const createSchema=z.object({permissions:permissionsSchema,name:z.string().trim().min(2).max(100),email:z.email().max(254),password:z.string().min(12).max(128),role:z.enum(STAFF)}).strict();
const updateSchema=z.object({id:z.string().regex(/^[a-f0-9]{24}$/i),role:z.enum(STAFF).optional(),permissions:permissionsSchema.optional(),active:z.boolean().optional()}).strict().refine(x=>x.role!==undefined||x.active!==undefined||x.permissions!==undefined);
export async function GET(){
 try{
  await authorize(["owner"]);
  await db();
  const users=await User.find({}).select("name email role active permissions createdAt updatedAt").sort({createdAt:-1}).limit(150).lean<any[]>();
  return Response.json({users:users.map(u=>({id:String(u._id),name:u.name,email:u.email,role:u.role,active:u.active,permissions:decodePermissionMap(u.permissions),createdAt:u.createdAt})),roles:STAFF},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{
  assertOrigin(request);const actor=await authorize(["owner"]);
  const input=createSchema.parse(await request.json());
  await db();const email=input.email.toLowerCase();
  if(await User.exists({email}))throw new HttpError(409,"Email already registered");
  const hash=await bcrypt.hash(input.password,12);
  const session=await mongoose.startSession();let id="";
  try{await session.withTransaction(async()=>{
   const [u]=await User.create([{name:input.name,email,role:input.role,passwordHash:hash,permissions:Object.fromEntries(Object.entries(input.permissions).map(([k,v])=>[encodePermissionKey(k as typeof PERMISSIONS[number]),v])),active:true}],{session});
   id=String(u._id);
   await Audit.create([{actorId:actor.id,action:"staff.created",entity:"User",entityId:id,details:{role:input.role}}],{session});
  });}finally{await session.endSession();}
  return Response.json({id,created:true},{status:201});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Email already registered"},{status:409});return apiError(e);}
}
export async function PATCH(request:Request){
 try{
  assertOrigin(request);const actor=await authorize(["owner"]);
  const input=updateSchema.parse(await request.json());
  if(input.id===actor.id)throw new HttpError(400,"You cannot change your own role or status here");
  await db();
  const session=await mongoose.startSession();
  try{await session.withTransaction(async()=>{
   const target=await User.findById(input.id).session(session);
   if(!target)throw new HttpError(404,"Staff account not found");
   if(target.role==="owner")throw new HttpError(403,"Owner account cannot be modified here");
   const previous={role:target.role,active:target.active};
   if(input.role!==undefined)target.role=input.role;
   if(input.active!==undefined)target.active=input.active;
   if(input.permissions!==undefined)target.permissions=new Map(Object.entries(input.permissions).map(([k,v])=>[encodePermissionKey(k as typeof PERMISSIONS[number]),v]));
   await target.save({session});
   await Audit.create([{actorId:actor.id,action:"staff.updated",entity:"User",entityId:input.id,details:{before:previous,after:{role:target.role,active:target.active,permissions:input.permissions!==undefined?input.permissions:undefined}}}],{session});
  });}finally{await session.endSession();}
  return Response.json({updated:true});
 }catch(e){return apiError(e);}
}
