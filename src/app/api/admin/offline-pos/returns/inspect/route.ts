import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {PosCashReturn,WarehouseLocation,WarehouseBalance,Product,StockMovement,Audit} from "@/lib/models";
import {inspectPosReturnInput,validatePosInspection} from "@/lib/pos-return-inspection";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function POST(request:Request){
 try{
  assertOrigin(request);
  const actor=await authorize(["owner","admin","inventory"],"inventory.edit");
  const input=inspectPosReturnInput.parse(await request.json());
  await db();const session=await mongoose.startSession();let result:{returnId:string;outcome:string;alreadyApplied:boolean;items:number}|null=null;
  try{
   await session.withTransaction(async()=>{
    const record=await PosCashReturn.findById(input.returnId).session(session).lean<any>();
    if(!record)throw new HttpError(404,"Return record not found");
    if(record.inspectionState&&record.inspectionState!=="pending"){
     if(record.inspectionState!==input.outcome)throw new HttpError(409,"Return already has a different inspection outcome");
     result={returnId:input.returnId,outcome:record.inspectionState,alreadyApplied:true,items:record.lines.reduce((n:number,l:any)=>n+l.quantity,0)};return;
    }
    try{validatePosInspection(record.disposition,input.outcome);}
    catch(e){throw new HttpError(409,e instanceof Error?e.message:"Invalid stock disposition");}
    if(input.outcome==="restocked"){
     const branch=await WarehouseLocation.findOne({_id:record.branchId,active:true}).select("_id").session(session);
     if(!branch)throw new HttpError(409,"Original branch is inactive. Reopen or transfer to a valid location before restocking");
    }
    // Claim exactly one pending inspection in the same transaction as all inventory movements.
    const claimed=await PosCashReturn.findOneAndUpdate({_id:input.returnId,inspectionState:{$in:["pending",null]}},
     {$set:{inspectionState:input.outcome,inspectionNote:input.note,inspectedBy:actor.id,inspectedAt:new Date()}},
     {new:true,session});
    if(!claimed)throw new HttpError(409,"Return was inspected concurrently. Reload record");
    if(input.outcome==="restocked"){
     for(const item of record.lines){
      const product=await Product.findOneAndUpdate({_id:item.productId,active:true,archived:{$ne:true}},{$inc:{onHand:item.quantity}},{session,new:true});
      if(!product)throw new HttpError(409,"Product "+item.sku+" is inactive or archived; return remains quarantined");
      await WarehouseBalance.findOneAndUpdate({productId:item.productId,locationId:record.branchId},
       {$inc:{quantity:item.quantity}},{session,new:true,upsert:true,setDefaultsOnInsert:true});
      await StockMovement.create([{productId:item.productId,type:"receive",deltaOnHand:item.quantity,actorId:actor.id,
       note:"Inspected POS return "+record.invoiceNumber+" / "+String(record._id)+" approved for resale"}],{session});
     }
    }
    await Audit.create([{actorId:actor.id,action:input.outcome==="restocked"?"pos.return.inspection.restocked":"pos.return.inspection.disposed",
     entity:"PosCashReturn",entityId:String(record._id),details:{branchId:String(record.branchId),invoiceNumber:record.invoiceNumber,
      outcome:input.outcome,items:record.lines.reduce((sum:number,l:any)=>sum+l.quantity,0),note:input.note}}],{session});
    result={returnId:String(record._id),outcome:input.outcome,alreadyApplied:false,items:record.lines.reduce((n:number,l:any)=>n+l.quantity,0)};
   },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});
  }finally{await session.endSession();}
  return Response.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(error:any){
  if(error?.code===11000)return Response.json({error:"Concurrent stock update. Reload the inspection and try again."},{status:409});
  return apiError(error);
 }
}
