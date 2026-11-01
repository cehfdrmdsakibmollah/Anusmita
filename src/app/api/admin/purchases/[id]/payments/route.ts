
import {createHash} from "node:crypto";
import mongoose from "mongoose";
import {authorize,authorizePermission,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Audit,PurchaseOrder,SupplierPayment} from "@/lib/models";
import {paymentReferenceKey,remainingSupplierBalance,supplierPaymentSchema} from "@/lib/supplier-payments";
export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(_req:Request,ctx:{params:Promise<{id:string}>}){
 try{
  await authorize(["owner","admin","finance","purchasing"],"finance.view");
  const {id}=await ctx.params;
  if(!mongoose.isValidObjectId(id))throw new HttpError(400,"Invalid purchase ID");
  await db();
  const payments=await SupplierPayment.find({purchaseOrderId:id}).sort({createdAt:-1}).limit(100)
    .select("method reference amountPaisa note verifiedAt verifiedBy createdAt")
    .populate("verifiedBy","name role").lean<any[]>();
  return Response.json({payments:payments.map(x=>({
   id:String(x._id),method:x.method,reference:x.reference,
   amountPaisa:x.amountPaisa,note:x.note,verifiedAt:x.verifiedAt,
   verifiedBy:x.verifiedBy?.name||"Staff"
  }))},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}

export async function POST(req:Request,ctx:{params:Promise<{id:string}>}){
 try{
  assertOrigin(req);
  const actor=await authorize(["owner","admin","finance"],"finance.edit");
  const {id}=await ctx.params;
  if(!mongoose.isValidObjectId(id))throw new HttpError(400,"Invalid purchase ID");
  if(Number(req.headers.get("content-length")||"0")>12000)throw new HttpError(413,"Payment request too large");
  const input=supplierPaymentSchema.parse(await req.json());
  const refKey=paymentReferenceKey(input.reference);
  const requestHash=createHash("sha256").update(JSON.stringify({
   purchase:id,method:input.method,reference:refKey,amountPaisa:input.amountPaisa,note:input.note
  })).digest("hex");
  await db();
  const previous=async()=>{
   const payment=await SupplierPayment.findOne({paymentKey:input.paymentKey}).lean<any>();
   if(!payment)return null;
   if(payment.requestHash!==requestHash||String(payment.purchaseOrderId)!==id)
    throw new HttpError(409,"Payment key has already been used for a different payment");
   const po=await PurchaseOrder.findById(id).select("status invoiceTotalPaisa paidPaisa").lean<any>();
   return {paymentId:String(payment._id),purchaseOrderId:id,
    paidPaisa:po?.paidPaisa,remainingPaisa:po?Math.max(0,po.invoiceTotalPaisa-po.paidPaisa):null,
    alreadyRecorded:true};
  };
  const replay=await previous();
  if(replay)return Response.json(replay,{headers:{"Cache-Control":"private, no-store"}});
  let output:any;
  const session=await mongoose.startSession();
  try{
   await session.withTransaction(async()=>{
    const existing=await SupplierPayment.findOne({paymentKey:input.paymentKey}).session(session);
    if(existing){
     if(existing.requestHash!==requestHash||String(existing.purchaseOrderId)!==id)
      throw new HttpError(409,"Payment key has already been used");
     const previousPo=await PurchaseOrder.findById(id).session(session);
     output={paymentId:String(existing._id),purchaseOrderId:id,paidPaisa:previousPo?.paidPaisa,
      remainingPaisa:previousPo?previousPo.invoiceTotalPaisa-previousPo.paidPaisa:null,alreadyRecorded:true};
     return;
    }
    const po=await PurchaseOrder.findById(id).session(session);
    if(!po)throw new HttpError(404,"Purchase order not found");
    if(!["submitted","partially_received","received"].includes(po.status))
     throw new HttpError(409,"Supplier payments may only be recorded for submitted purchase orders");
    try{remainingSupplierBalance(po.invoiceTotalPaisa,po.paidPaisa,input.amountPaisa);}
    catch(e){throw new HttpError(409,e instanceof Error?e.message:"Invalid supplier payment");}
    const next=po.paidPaisa+input.amountPaisa;
    // In the same Atlas transaction, PO write conflict prevents concurrent
    // finance operators from silently exceeding the outstanding balance.
    po.paidPaisa=next;
    await po.save({session});
    const [payment]=await SupplierPayment.create([{
     purchaseOrderId:po._id,supplierId:po.supplierId,
     paymentKey:input.paymentKey,requestHash,
     method:input.method,reference:input.reference.trim(),
     referenceKey:refKey,amountPaisa:input.amountPaisa,
     note:input.note,status:"verified",verifiedAt:new Date(),verifiedBy:actor.id
    }],{session});
    await Audit.create([{
     actorId:actor.id,action:"purchase.supplier_payment_recorded",
     entity:"PurchaseOrder",entityId:String(po._id),
     details:{paymentId:String(payment._id),method:input.method,
      amountPaisa:input.amountPaisa,remainingPaisa:po.invoiceTotalPaisa-next}
    }],{session});
    output={paymentId:String(payment._id),purchaseOrderId:id,paidPaisa:next,
     remainingPaisa:po.invoiceTotalPaisa-next,alreadyRecorded:false};
   },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});
  }catch(e:any){
   if(e?.code===11000){
    const prior=await previous();
    if(prior)return Response.json(prior,{headers:{"Cache-Control":"private, no-store"}});
    throw new HttpError(409,"Supplier payment reference already recorded. Check the ledger before retrying.");
   }
   // Network / concurrent write conflicts must not be quietly retried with a
   // different paymentKey; the original reference can be queried first.
   throw e;
  }finally{await session.endSession();}
  return Response.json(output,{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
