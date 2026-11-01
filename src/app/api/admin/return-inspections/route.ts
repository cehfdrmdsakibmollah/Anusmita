import mongoose from "mongoose";
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Order,ReturnInspection,Audit} from "@/lib/models";
export const dynamic="force-dynamic";
const id=z.string().regex(/^[a-f0-9]{24}$/i);
const schema=z.object({
 orderId:id,
 condition:z.enum(["pending","sellable","damaged","quarantine"]),
 note:z.string().trim().min(8).max(500),
 revision:z.number().int().nonnegative()
}).strict();
export async function GET(request:Request){
 try{
  await authorize(["owner","admin","inventory","sales","support"],"orders.view");
  await db();
  const page=Math.max(1,Math.min(100,Number.parseInt(new URL(request.url).searchParams.get("page")||"1",10)||1));
  const orders=await Order.find({isTest:false,orderStatus:"returned"}).select("orderNumber createdAt updatedAt").sort({updatedAt:-1}).skip((page-1)*30).limit(30).lean<any[]>();
  const inspectionRows=await ReturnInspection.find({orderId:{$in:orders.map(o=>o._id)}}).select("orderId condition note inspectedAt revision").lean<any[]>();
  const lookup=new Map(inspectionRows.map(x=>[String(x.orderId),x]));
  return Response.json({page,items:orders.map(o=>{const inspection=lookup.get(String(o._id));return {orderId:String(o._id),orderNumber:o.orderNumber,returnedAt:o.updatedAt,condition:inspection?.condition||"uninspected",note:inspection?.note||"",revision:inspection?.revision||0,inspectedAt:inspection?.inspectedAt||null};}),note:"Inspection labels do not alter inventory. Physical restocking requires a separate authorized stock adjustment."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiError(error);}
}
export async function POST(request:Request){
 try{
  assertOrigin(request);
  const actor=await authorize(["owner","admin","inventory"],"inventory.edit");
  const input=schema.parse(await request.json());
  await db();
  const session=await mongoose.startSession();
  let nextRevision=0;
  try{await session.withTransaction(async()=>{
   const order=await Order.findOne({_id:input.orderId,isTest:false,orderStatus:"returned"}).session(session);
   if(!order)throw new HttpError(409,"Only existing returned non-test orders can be inspected.");
   const old=await ReturnInspection.findOne({orderId:input.orderId}).session(session);
   if(Number(old?.revision||0)!==input.revision)throw new HttpError(409,"Inspection was updated; refresh before saving.");
   if(old){
    const result=await ReturnInspection.updateOne({_id:old._id,revision:input.revision},{$set:{condition:input.condition,note:input.note,inspectedBy:actor.id,inspectedAt:new Date()},$inc:{revision:1}},{session});
    if(result.modifiedCount!==1)throw new HttpError(409,"Concurrent edit; refresh and retry.");
    nextRevision=input.revision+1;
   }else{
    await ReturnInspection.create([{orderId:input.orderId,condition:input.condition,note:input.note,inspectedBy:actor.id,revision:1}],{session});
    nextRevision=1;
   }
   await Audit.create([{actorId:actor.id,action:"return.inspected",entity:"Order",entityId:input.orderId,details:{previousCondition:old?.condition||"uninspected",condition:input.condition,revision:nextRevision}}],{session});
  });}finally{await session.endSession();}
  return Response.json({saved:true,revision:nextRevision},{headers:{"Cache-Control":"no-store"}});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Concurrent inspection, refresh and retry"},{status:409});return apiError(e);}
}
