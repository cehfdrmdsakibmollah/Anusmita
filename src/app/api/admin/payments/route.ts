
import mongoose from "mongoose";
import { assertOrigin,authorize,authorizePermission,apiError,HttpError } from "@/lib/auth";
import { db } from "@/lib/db";
import { Order,Payment,Audit } from "@/lib/models";
import { paymentSchema } from "@/lib/validation";
import { paymentStatus } from "@/lib/money";
export async function POST(request:Request) {
 try {
  assertOrigin(request);
  const actor=await authorizePermission(["owner","admin","finance"],"finance.edit");
  const raw=await request.json();
  if(raw.verificationConfirmed!==true) throw new HttpError(400,"Confirm independent transaction verification before recording funds");
  const {verificationConfirmed: _operatorAttestation, ...payload}=raw;
  const data=paymentSchema.parse(payload);
  // IMPORTANT: verificationConfirmed is an operator attestation, not an automated provider verification.
  await db();
  const session=await mongoose.startSession();let result:any;
  try {
   await session.withTransaction(async()=>{
    const order=await Order.findById(data.orderId).session(session);
    if(!order || order.orderStatus==="cancelled") throw new HttpError(404,"Eligible order not found");
    if(order.collectedPaisa+data.amountPaisa>order.totalPaisa) throw new HttpError(409,"Payment exceeds outstanding balance");
    const [payment]=await Payment.create([{orderId:order._id,method:data.method,reference:data.reference,amountPaisa:data.amountPaisa,direction:"collection",status:"verified",verifiedBy:actor.id,verifiedAt:new Date(),note:data.note}],{session});
    order.collectedPaisa+=data.amountPaisa;order.paymentStatus=paymentStatus(order.totalPaisa,order.collectedPaisa);
    await order.save({session});
    await Audit.create([{actorId:actor.id,action:"payment.manual_verified",entity:"Payment",entityId:String(payment._id),details:{orderId:String(order._id),amountPaisa:data.amountPaisa}}],{session});
    result={paymentId:String(payment._id),collectedPaisa:order.collectedPaisa,paymentStatus:order.paymentStatus};
   });
  }finally{await session.endSession();}
  return Response.json(result,{status:201});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Payment reference already recorded"},{status:409});return apiError(e);}
}
