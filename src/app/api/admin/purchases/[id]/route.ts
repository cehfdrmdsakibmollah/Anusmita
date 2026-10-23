
import mongoose from "mongoose";
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {PurchaseOrder,Audit} from "@/lib/models";
export const runtime="nodejs";
const actionSchema=z.object({action:z.enum(["submit","cancel"]),expectedUpdatedAt:z.iso.datetime({offset:true})}).strict();
export async function PATCH(req:Request,ctx:{params:Promise<{id:string}>}){
 try{
  assertOrigin(req);
  const actor=await authorize(["owner","admin","purchasing"]);
  const {id}=await ctx.params;
  if(!mongoose.isValidObjectId(id))throw new HttpError(400,"Invalid purchase order ID");
  const data=actionSchema.parse(await req.json());
  await db();let result:any;
  const session=await mongoose.startSession();
  try{
   await session.withTransaction(async()=>{
    const po=await PurchaseOrder.findById(id).session(session);
    if(!po)throw new HttpError(404,"Purchase order not found");
    if(new Date(po.updatedAt).getTime()!==new Date(data.expectedUpdatedAt).getTime())
      throw new HttpError(409,"Purchase order was modified; refresh first");
    if(data.action==="submit"&&po.status!=="draft")
      throw new HttpError(409,"Only draft purchases can be submitted");
    if(data.action==="cancel"&&(!["draft","submitted"].includes(po.status)||po.items.some((i:any)=>i.received>0)))
      throw new HttpError(409,"Cannot cancel a purchase after goods have been received");
    po.status=data.action==="submit"?"submitted":"cancelled";
    if(data.action==="submit")po.submittedAt=new Date();
    await po.save({session});
    await Audit.create([{actorId:actor.id,action:"purchase."+data.action,entity:"PurchaseOrder",entityId:String(po._id),
      details:{status:po.status}}],{session});
    result={id:String(po._id),status:po.status,updatedAt:po.updatedAt};
   });
  }finally{await session.endSession();}
  return Response.json(result);
 }catch(e){return apiError(e);}
}
