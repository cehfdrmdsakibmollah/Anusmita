import mongoose from "mongoose";
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {WarehouseLocation,WarehouseBalance,OfflineSale,Audit} from "@/lib/models";
export const dynamic="force-dynamic";
const id=z.string().regex(/^[a-f0-9]{24}$/i);
const create=z.object({
 code:z.string().trim().regex(/^[A-Za-z0-9_-]{2,24}$/),
 name:z.string().trim().min(2).max(100),
 address:z.string().trim().max(250).default(""),
 phone:z.string().trim().max(20).default(""),
 managerName:z.string().trim().max(100).default("")
}).strict();
const update=create.omit({code:true}).extend({id,active:z.boolean()}).strict();
export async function GET(){
 try{
  await authorize(["owner","admin","inventory"],"inventory.view");await db();
  const locations=await WarehouseLocation.find({}).select("code name address phone managerName active createdAt").sort({name:1}).limit(200).lean<any[]>();
  const counts=await WarehouseBalance.aggregate([{$group:{_id:"$locationId",stock:{$sum:"$quantity"},skus:{$sum:{$cond:[{$gt:["$quantity",0]},1,0]}}}}]);
  const map=new Map(counts.map(x=>[String(x._id),{stock:x.stock,skus:x.skus}]));
  return Response.json({branches:locations.map(x=>({id:String(x._id),code:x.code,name:x.name,address:x.address||"",phone:x.phone||"",managerName:x.managerName||"",active:x.active,createdAt:x.createdAt,...(map.get(String(x._id))||{stock:0,skus:0})}))},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{
  assertOrigin(request);const actor=await authorize(["owner","admin"],"inventory.edit");
  const input=create.parse(await request.json());
  await db();const session=await mongoose.startSession();let result:any=null;
  try{await session.withTransaction(async()=>{
   const [location]=await WarehouseLocation.create([{...input,code:input.code.toUpperCase(),active:true,createdBy:actor.id}],{session});
   result={id:String(location._id),code:location.code};
   await Audit.create([{actorId:actor.id,action:"pos.branch.created",entity:"WarehouseLocation",entityId:result.id,details:{code:location.code}}],{session});
  });}finally{await session.endSession();}
  return Response.json(result,{status:201});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Branch code already exists"},{status:409});return apiError(e);}
}
export async function PATCH(request:Request){
 try{
  assertOrigin(request);const actor=await authorize(["owner","admin"],"inventory.edit");
  const input=update.parse(await request.json());
  await db();const session=await mongoose.startSession();
  try{await session.withTransaction(async()=>{
   if(!input.active){
    const [positive,sales]=await Promise.all([
     WarehouseBalance.exists({locationId:input.id,quantity:{$gt:0}}).session(session),
     OfflineSale.exists({branchId:input.id}).session(session)
    ]);
    if(positive)throw new HttpError(409,"Cannot archive a branch with allocated stock. Transfer inventory out first");
    // Historical POS sales are preserved; archived branches remain visible in admin reports.
    void sales;
   }
   const updated=await WarehouseLocation.updateOne({_id:input.id},{$set:{name:input.name,address:input.address,phone:input.phone,managerName:input.managerName,active:input.active}},{session,runValidators:true});
   if(!updated.matchedCount)throw new HttpError(404,"Branch not found");
   await Audit.create([{actorId:actor.id,action:"pos.branch.updated",entity:"WarehouseLocation",entityId:input.id,details:{active:input.active,name:input.name}}],{session});
  });}finally{await session.endSession();}
  return Response.json({updated:true},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
