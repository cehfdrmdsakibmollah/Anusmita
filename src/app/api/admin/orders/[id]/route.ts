
import mongoose from "mongoose";
import { z } from "zod";
import { authorize,assertOrigin,apiError,HttpError } from "@/lib/auth";
import { db } from "@/lib/db";
import { Order,Product,StockMovement,Audit } from "@/lib/models";
const transitions:Record<string,string[]>={placed:["confirmed","cancelled"],confirmed:["packed","cancelled"],packed:["shipped","cancelled"],shipped:["delivered"]};
const schema=z.object({status:z.enum(["confirmed","packed","shipped","delivered","cancelled"]),trackingReference:z.string().trim().max(120).optional()}).strict();
export async function PATCH(request:Request,ctx:{params:Promise<{id:string}>}) {
 try {
  assertOrigin(request);
  const actor=await authorize(["owner","admin","sales"]);
  const {id}=await ctx.params;
  if(!mongoose.isValidObjectId(id)) throw new HttpError(400,"Invalid order ID");
  const {status,trackingReference}=schema.parse(await request.json());
  if(status==="shipped" && !trackingReference) throw new HttpError(400,"Confirmed courier tracking reference required");
  await db();let result:any;
  const session=await mongoose.startSession();
  try{
   await session.withTransaction(async()=>{
    const order=await Order.findById(id).session(session);
    if(!order) throw new HttpError(404,"Order not found");
    if(!transitions[order.orderStatus]?.includes(status)) throw new HttpError(409,"Invalid order status transition");
    if(status==="cancelled" || status==="delivered") {
     for(const line of order.lines) {
      const update=status==="cancelled"?{$inc:{reserved:-line.quantity}}:{$inc:{reserved:-line.quantity,onHand:-line.quantity}};
      const product=await Product.findOneAndUpdate({_id:line.productId,reserved:{$gte:line.quantity},...(status==="delivered"?{onHand:{$gte:line.quantity}}:{})},update,{new:true,session});
      if(!product) throw new HttpError(409,"Stock conflict; order unchanged");
      await StockMovement.create([{productId:line.productId,orderId:order._id,type:status==="cancelled"?"release":"fulfil",deltaReserved:-line.quantity,deltaOnHand:status==="delivered"?-line.quantity:0,actorId:actor.id,note:"Order "+status}],{session});
     }
    }
    order.orderStatus=status;
    if(status==="confirmed")order.confirmedAt=new Date();
    if(status==="shipped") {order.shippedAt=new Date();order.financeNote="Tracking: "+trackingReference;}
    if(status==="delivered")order.deliveredAt=new Date();
    if(status==="cancelled")order.cancelledAt=new Date();
    await order.save({session});
    await Audit.create([{actorId:actor.id,action:"order."+status,entity:"Order",entityId:String(order._id),details:{trackingReference:trackingReference||null}}],{session});
    result={id:String(order._id),status};
   });
  }finally{await session.endSession();}
  return Response.json(result);
 }catch(e){return apiError(e);}
}
