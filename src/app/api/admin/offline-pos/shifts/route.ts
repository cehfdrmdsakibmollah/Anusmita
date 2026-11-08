import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {PosCashShift,WarehouseLocation,Audit} from "@/lib/models";
import {openCashShiftInput,closeCashShiftInput,reconcileCashShift} from "@/lib/pos-cash-shifts";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const roles=["owner","admin","sales"] as const;
const view=(s:any)=>s?({
 id:String(s._id),branchId:String(s.branchId),branchName:s.branchName,cashierName:s.cashierName,
 status:s.status,openedAt:s.openedAt,closedAt:s.closedAt,openingFloatPaisa:s.openingFloatPaisa,
 cashSalesPaisa:s.cashSalesPaisa,cashRefundsPaisa:s.cashRefundsPaisa||0,saleCount:s.saleCount,expectedCashPaisa:s.expectedCashPaisa,
 closingCountPaisa:s.closingCountPaisa,variancePaisa:s.variancePaisa,closingNote:s.closingNote
}):null;
export async function GET(request:Request){
 try{
  const actor=await authorize([...roles],"orders.view");
  const branchId=new URL(request.url).searchParams.get("branchId")||"";
  if(!/^[a-f0-9]{24}$/i.test(branchId))throw new HttpError(400,"Select a valid branch");
  await db();
  const [current,history]=await Promise.all([
   PosCashShift.findOne({branchId,cashierId:actor.id,status:"open"}).lean<any>(),
   PosCashShift.find({branchId,cashierId:actor.id}).sort({openedAt:-1}).limit(15).lean<any[]>()
  ]);
  return Response.json({current:view(current),history:history.map(view)},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{
  assertOrigin(request);
  const actor=await authorize([...roles],"orders.edit");
  const data=openCashShiftInput.parse(await request.json());
  await db();
  const session=await mongoose.startSession();let result:any;
  try{
   await session.withTransaction(async()=>{
    const branch=await WarehouseLocation.findOne({_id:data.branchId,active:true}).select("name").session(session).lean<any>();
    if(!branch)throw new HttpError(409,"Branch not active");
    if(await PosCashShift.exists({branchId:data.branchId,cashierId:actor.id,status:"open"}).session(session))
     throw new HttpError(409,"Close the active cashier shift before opening another");
    const [shift]=await PosCashShift.create([{branchId:data.branchId,branchName:branch.name,cashierId:actor.id,cashierName:actor.name,status:"open",openingFloatPaisa:data.openingFloatPaisa,expectedCashPaisa:data.openingFloatPaisa}],{session});
    await Audit.create([{actorId:actor.id,action:"pos.cash.shift.opened",entity:"PosCashShift",entityId:String(shift._id),details:{branchId:data.branchId,openingFloatPaisa:data.openingFloatPaisa}}],{session});
    result=view(shift);
   },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});
  }finally{await session.endSession();}
  return Response.json({shift:result},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e:any){
  if(e?.code===11000)return Response.json({error:"An open shift already exists for this cashier at this branch"},{status:409});
  return apiError(e);
 }
}
export async function PATCH(request:Request){
 try{
  assertOrigin(request);
  const actor=await authorize([...roles],"orders.edit");
  const data=closeCashShiftInput.parse(await request.json());
  await db();let result:any;
  const session=await mongoose.startSession();
  try{
   await session.withTransaction(async()=>{
    const shift=await PosCashShift.findOne({_id:data.shiftId,cashierId:actor.id,status:"open"}).session(session).lean<any>();
    if(!shift)throw new HttpError(409,"Shift was already closed or belongs to another cashier");
    const money=reconcileCashShift(shift.openingFloatPaisa,shift.cashSalesPaisa,data.closingCountPaisa,shift.cashRefundsPaisa||0);
    // Compare cash accumulation in this same atomic update; a concurrent sale
    // changing shift.cashSalesPaisa causes a write conflict or CAS rejection.
    const closed=await PosCashShift.findOneAndUpdate({
     _id:data.shiftId,cashierId:actor.id,status:"open",
     cashSalesPaisa:shift.cashSalesPaisa,cashRefundsPaisa:shift.cashRefundsPaisa||{$in:[0,null]},saleCount:shift.saleCount
    },{$set:{...money,status:"closed",closingNote:data.closingNote,closedAt:new Date(),closedBy:actor.id}},{new:true,session});
    if(!closed)throw new HttpError(409,"Another sale changed this shift. Reload before closing.");
    await Audit.create([{actorId:actor.id,action:"pos.cash.shift.closed",entity:"PosCashShift",entityId:String(closed._id),
     details:{branchId:String(closed.branchId),saleCount:closed.saleCount,cashRefundsPaisa:closed.cashRefundsPaisa||0,expectedCashPaisa:closed.expectedCashPaisa,closingCountPaisa:closed.closingCountPaisa,variancePaisa:closed.variancePaisa}}],{session});
    result=view(closed);
   },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});
  }finally{await session.endSession();}
  return Response.json({shift:result},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
