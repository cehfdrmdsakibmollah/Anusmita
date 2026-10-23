
import {createHash} from "node:crypto";
import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {PurchaseOrder,PurchaseReceipt,Product,StockMovement,Audit} from "@/lib/models";
import {receiptSchema,receivePlan} from "@/lib/procurement";
export const runtime="nodejs";
type Out={id:string;receiptId:string;status:string;receivedUnits:number;alreadyApplied?:boolean};

export async function POST(req:Request,ctx:{params:Promise<{id:string}>}){
 try{
  assertOrigin(req);
  const actor=await authorize(["owner","admin","inventory","purchasing"]);
  const {id}=await ctx.params;
  if(!mongoose.isValidObjectId(id))throw new HttpError(400,"Invalid PO identifier");
  if(Number(req.headers.get("content-length")||0)>16000)throw new HttpError(413,"Goods receipt too large");
  const input=receiptSchema.parse(await req.json());
  const canonicalLines=input.lines.map(x=>({productId:x.productId.toLowerCase(),quantity:x.quantity})).sort((a,b)=>a.productId.localeCompare(b.productId));
  const hash=createHash("sha256").update(JSON.stringify({poId:id,lines:canonicalLines,note:input.note})).digest("hex");
  await db();
  const lookup=async()=>{
   const existing=await PurchaseReceipt.findOne({receiptKey:input.receiptKey}).lean<any>();
   if(!existing)return null;
   if(existing.requestHash!==hash||String(existing.purchaseOrderId)!==id)throw new HttpError(409,"Receipt key was reused with different content");
   return {id,receiptId:String(existing._id),status:existing.poStatus,receivedUnits:existing.receivedUnits,alreadyApplied:true} as Out;
  };
  const previous=await lookup();if(previous)return Response.json(previous);
  const session=await mongoose.startSession();let result:Out|undefined;
  try{
   await session.withTransaction(async()=>{
    const existing=await PurchaseReceipt.findOne({receiptKey:input.receiptKey}).session(session);
    if(existing){
     if(existing.requestHash!==hash||String(existing.purchaseOrderId)!==id)throw new HttpError(409,"Receipt key already used for another request");
     result={id,receiptId:String(existing._id),status:existing.poStatus,receivedUnits:existing.receivedUnits,alreadyApplied:true};
     return;
    }
    const po=await PurchaseOrder.findById(id).session(session);
    if(!po)throw new HttpError(404,"Purchase order not found");
    if(!["submitted","partially_received"].includes(po.status))throw new HttpError(409,"Only submitted purchases can receive goods");
    let planned:ReturnType<typeof receivePlan>;
    try{
     planned=receivePlan(po.items.map((p:any)=>({productId:String(p.productId),quantity:p.quantity,received:p.received,unitCostPaisa:p.unitCostPaisa})),canonicalLines);
    }catch(e){throw new HttpError(409,e instanceof Error?e.message:"Invalid goods receipt");}
    for(const line of canonicalLines){
     const item=po.items.find((x:any)=>String(x.productId)===line.productId)!;
     const changed=await Product.updateOne({_id:line.productId},{$inc:{onHand:line.quantity}},{session});
     if(changed.matchedCount!==1)throw new HttpError(409,"Product disappeared during receiving");
     await StockMovement.create([{productId:line.productId,purchaseOrderId:po._id,type:"receive",
       deltaOnHand:line.quantity,actorId:actor.id,note:"PO "+String(po._id)+" goods receipt "+input.receiptKey+"; "+input.note}],{session});
     // Preserve the cost captured on the original PO; never silently change selling price or product cost.
     if(!Number.isSafeInteger(item.unitCostPaisa))throw new HttpError(409,"Invalid purchase line cost");
    }
    po.items.forEach((item:any)=>{
     const updated=planned.items.find(x=>x.productId===String(item.productId));
     item.received=updated!.received;
    });
    po.status=planned.status;
    if(planned.status==="received")po.receivedAt=new Date();
    await po.save({session});
    const [receipt]=await PurchaseReceipt.create([{
     purchaseOrderId:po._id,receiptKey:input.receiptKey,requestHash:hash,
     poStatus:po.status,receivedUnits:planned.receivedUnits,
     lines:canonicalLines,note:input.note,receivedBy:actor.id
    }],{session});
    await Audit.create([{actorId:actor.id,action:"purchase.goods_received",entity:"PurchaseOrder",entityId:String(po._id),
      details:{receiptId:String(receipt._id),receivedUnits:planned.receivedUnits,skuCount:canonicalLines.length,status:po.status}}],{session});
    result={id,receiptId:String(receipt._id),status:po.status,receivedUnits:planned.receivedUnits};
   },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});
  }catch(e:any){
   if(e?.code===11000){
    const committed=await lookup();if(committed)return Response.json(committed);
    throw new HttpError(409,"Concurrent goods receipt detected; refresh purchase before retrying");
   }
   throw e;
  }finally{await session.endSession();}
  return Response.json(result,{status:201});
 }catch(e){return apiError(e);}
}
