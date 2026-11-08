import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {OfflineSale,PosCashReturn,PosCashShift,Audit} from "@/lib/models";
import {bdBusinessDate} from "@/lib/offline-pos";
import {posReturnInput,cashRefundForReturn,remainingReturnQuantity} from "@/lib/pos-cash-returns";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const roles=["owner","admin"] as const;
const hex=/^[a-f0-9]{24}$/i;
export async function GET(request:Request){
 try{
  await authorize([...roles],"orders.view");
  const branchId=new URL(request.url).searchParams.get("branchId")||"";
  if(!hex.test(branchId))throw new HttpError(400,"Choose a valid branch");
  await db();
  const [sales,returns]=await Promise.all([
   OfflineSale.find({branchId,status:"completed"}).select("invoiceNumber createdAt branchName customerName subtotalPaisa totalPaisa refundedPaisa returnedGrossPaisa returnedQuantities lines")
    .sort({createdAt:-1}).limit(50).lean<any[]>(),
   PosCashReturn.find({branchId}).sort({createdAt:-1}).limit(50).lean<any[]>()
  ]);
  return Response.json({
   invoices:sales.map(s=>({id:String(s._id),invoiceNumber:s.invoiceNumber,createdAt:s.createdAt,branchName:s.branchName,customerName:s.customerName,
    subtotalPaisa:s.subtotalPaisa,totalPaisa:s.totalPaisa,refundedPaisa:s.refundedPaisa||0,
    lines:s.lines.map((l:any)=>({productId:String(l.productId),name:l.name,sku:l.sku,quantity:l.quantity,
     returnedQuantity:s.returnedQuantities?.get?.(String(l.productId))||s.returnedQuantities?.[String(l.productId)]||0,unitPricePaisa:l.unitPricePaisa}))})),
   returns:returns.map(r=>({id:String(r._id),invoiceNumber:r.invoiceNumber,createdAt:r.createdAt,managerName:r.managerName,refundedPaisa:r.refundedPaisa,reason:r.reason,disposition:r.disposition,lines:r.lines.map((l:any)=>({sku:l.sku,quantity:l.quantity}))}))
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{
  assertOrigin(request);
  const actor=await authorize([...roles],"orders.edit");
  const data=posReturnInput.parse(await request.json());
  if(new Set(data.lines.map(l=>l.productId)).size!==data.lines.length)throw new HttpError(400,"Duplicate return lines");
  await db();let output:any=null;
  const session=await mongoose.startSession();
  try{
   await session.withTransaction(async()=>{
    const prior=await PosCashReturn.findOne({operationKey:data.operationKey}).session(session).lean<any>();
    if(prior){
     const same=String(prior.saleId)===data.saleId&&prior.reason===data.reason&&prior.disposition===data.disposition&&
      prior.lines.length===data.lines.length&&data.lines.every(l=>prior.lines.some((p:any)=>String(p.productId)===l.productId&&p.quantity===l.quantity));
     if(!same)throw new HttpError(409,"Return operation key is already used for another refund");
     output={id:String(prior._id),refundPaisa:prior.refundedPaisa,alreadyApplied:true,invoiceNumber:prior.invoiceNumber};return;
    }
    const sale=await OfflineSale.findOne({_id:data.saleId,status:"completed",paymentMethod:"cash"}).session(session).lean<any>();
    if(!sale)throw new HttpError(404,"Original cash invoice not found");
    const shift=await PosCashShift.findOne({branchId:sale.branchId,cashierId:actor.id,status:"open"}).session(session).lean<any>();
    if(!shift)throw new HttpError(409,"Manager must open a cash shift at the original branch before refund");
    const original=new Map(sale.lines.map((l:any)=>[String(l.productId),l]));
    const entries=data.lines.map(line=>{
     const item:any=original.get(line.productId);
     if(!item)throw new HttpError(409,"Return product does not belong to invoice");
     const prev=Number(sale.returnedQuantities?.get?.(line.productId)??sale.returnedQuantities?.[line.productId]??0);
     if(line.quantity>remainingReturnQuantity(item.quantity,prev))throw new HttpError(409,"Requested quantity exceeds unreturned invoice quantity");
     return {productId:line.productId,sku:item.sku,name:item.name,quantity:line.quantity,grossPaisa:item.unitPricePaisa*line.quantity,unitCostPaisa:Number.isSafeInteger(item.unitCostPaisa)&&item.unitCostPaisa>=0?item.unitCostPaisa:null,returnedTotalQuantity:prev+line.quantity};
    });
    const gross=entries.reduce((sum,x)=>sum+x.grossPaisa,0);
    let refund:number;
    try{refund=cashRefundForReturn(sale.subtotalPaisa,sale.totalPaisa,sale.returnedGrossPaisa||0,gross);}
    catch(e){throw new HttpError(409,e instanceof Error?e.message:"Invalid partial refund");}
    if((sale.refundedPaisa||0)+refund>sale.totalPaisa)throw new HttpError(409,"Refund would exceed total paid");
    const updates:Record<string,number>={};
    for(const line of entries)updates["returnedQuantities."+line.productId]=line.returnedTotalQuantity;
    const updated=await OfflineSale.findOneAndUpdate({_id:sale._id,status:"completed",
     $expr:{$lte:[{$add:[{$ifNull:["$returnedGrossPaisa",0]},gross]},"$subtotalPaisa"]}},
     {$inc:{returnedGrossPaisa:gross,refundedPaisa:refund},$set:updates},{session,new:true});
    if(!updated)throw new HttpError(409,"Invoice changed during refund. Reload before retrying");
    const drawer=await PosCashShift.findOneAndUpdate({_id:shift._id,status:"open",expectedCashPaisa:{$gte:refund}},
     {$inc:{cashRefundsPaisa:refund,expectedCashPaisa:-refund}},{session,new:true});
    if(!drawer)throw new HttpError(409,"Insufficient expected cash in active manager drawer or shift closed");
    const date=bdBusinessDate(new Date());
    const [result]=await PosCashReturn.create([{operationKey:data.operationKey,saleId:sale._id,invoiceNumber:sale.invoiceNumber,
     branchId:sale.branchId,branchName:sale.branchName,managerId:actor.id,managerName:actor.name,shiftId:shift._id,
     lines:entries.map(({returnedTotalQuantity,...line})=>line),grossReturnPaisa:gross,refundedPaisa:refund,
     reason:data.reason,disposition:data.disposition,businessDate:date}],{session});
    await Audit.create([{actorId:actor.id,action:"pos.cash.refund.completed",entity:"PosCashReturn",entityId:String(result._id),
     details:{saleId:String(sale._id),invoiceNumber:sale.invoiceNumber,branchId:String(sale.branchId),refundPaisa:refund,
      disposition:data.disposition,items:entries.reduce((n,l)=>n+l.quantity,0)}}],{session});
    output={id:String(result._id),refundPaisa:refund,alreadyApplied:false,invoiceNumber:sale.invoiceNumber};
   },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});
  }finally{await session.endSession();}
  return Response.json(output,{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e:any){
  if(e?.code===11000)return Response.json({error:"Refund already submitted. Refresh the return register before retrying with the same operation key."},{status:409});
  return apiError(e);
 }
}
