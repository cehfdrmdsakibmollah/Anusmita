import {z} from "zod";
import mongoose from "mongoose";
import {authorize,authorizePermission,apiError,assertOrigin,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {WarehouseLocation,Audit} from "@/lib/models";
export const dynamic="force-dynamic";
const schema=z.object({code:z.string().trim().regex(/^[A-Za-z0-9_-]{2,24}$/),name:z.string().trim().min(2).max(100),address:z.string().trim().max(250).default("")}).strict();
export async function GET(){
 try{
  await authorizePermission(["owner","admin","inventory","purchasing"],"inventory.view");
  await db();
  const rows=await WarehouseLocation.find({}).select("code name address active createdAt").sort({createdAt:-1}).limit(100).lean<any[]>();
  return Response.json({locations:rows.map(x=>({id:String(x._id),code:x.code,name:x.name,address:x.address,active:x.active,createdAt:x.createdAt})),
   stockAllocationEnabled:false,note:"Locations are organizational records. Stock is not assigned to locations and transfers are disabled."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{
  assertOrigin(request);
  const actor=await authorizePermission(["owner","admin"],"inventory.edit");
  const body=schema.parse(await request.json());
  await db();
  const code=body.code.toUpperCase();
  if(await WarehouseLocation.exists({code}))throw new HttpError(409,"Location code already registered");
  // This operation adds a location record only; no Product inventory fields are altered.
  const session=await mongoose.startSession();let id="";
  try{await session.withTransaction(async()=>{
   const [location]=await WarehouseLocation.create([{...body,code,createdBy:actor.id,active:true}],{session});
   id=String(location._id);
   await Audit.create([{actorId:actor.id,action:"warehouse.location.created",entity:"WarehouseLocation",entityId:id,details:{code}}],{session});
  });}finally{await session.endSession();}
  return Response.json({id,code},{status:201});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Location code already registered"},{status:409});return apiError(e);}
}
