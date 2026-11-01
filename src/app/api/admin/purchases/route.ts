
import mongoose from "mongoose";
import {z} from "zod";
import {authorize,authorizePermission,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Supplier,Product,PurchaseOrder,Audit} from "@/lib/models";
import {createPurchaseSchema,purchaseValue} from "@/lib/procurement";
export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(req:Request){
 try{
  await authorize(["owner","admin","purchasing","inventory","finance"],"purchasing.view");
  const q=new URL(req.url).searchParams;
  const page=Math.max(1,Math.min(10000,Number(q.get("page"))||1));
  const statuses=["draft","submitted","partially_received","received","cancelled"];
  const status=q.get("status");
  if(status&&!statuses.includes(status))throw new HttpError(400,"Invalid purchase status");
  await db();
  const filter=status?{status}:{};
  const [rows,total]=await Promise.all([
   PurchaseOrder.find(filter).sort({createdAt:-1}).skip((page-1)*25).limit(25)
    .populate("supplierId","name country").populate("items.productId","sku name onHand reserved").lean<any[]>(),
   PurchaseOrder.countDocuments(filter)
  ]);
  return Response.json({purchases:rows.map(x=>({...x,_id:String(x._id)})),page,total,pages:Math.ceil(total/25)},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(req:Request){
 try{
  assertOrigin(req);
  const actor=await authorize(["owner","admin","purchasing"],"purchasing.edit");
  if(Number(req.headers.get("content-length")||0)>16000)throw new HttpError(413,"Purchase request too large");
  const data=createPurchaseSchema.parse(await req.json());
  let total:number;
  try{total=purchaseValue(data.items.map(x=>({quantity:x.quantity,unitCostPaisa:x.unitCostPaisa})));}catch(e){throw new HttpError(400,"Invalid purchase value");}
  await db();
  let output:any;
  const session=await mongoose.startSession();
  try{
   await session.withTransaction(async()=>{
    const supplier=await Supplier.findOne({_id:data.supplierId,active:true}).session(session).lean<any>();
    if(!supplier)throw new HttpError(404,"Supplier is missing or inactive");
    const products=await Product.find({_id:{$in:data.items.map(x=>x.productId)}}).select("sku name supplierId").session(session).lean<any[]>();
    if(products.length!==data.items.length)throw new HttpError(400,"One or more product IDs do not exist");
    const map=new Map(products.map(p=>[String(p._id).toLowerCase(),p]));
    const lines=data.items.map(x=>{
     const p=map.get(x.productId.toLowerCase());
     if(!p)throw new HttpError(400,"Unknown product");
     if(p.supplierId&&String(p.supplierId)!==data.supplierId)throw new HttpError(409,"Product "+p.sku+" belongs to a different assigned supplier");
     return {productId:p._id,sku:p.sku,name:p.name,quantity:x.quantity,received:0,unitCostPaisa:x.unitCostPaisa};
    });
    const [po]=await PurchaseOrder.create([{supplierId:data.supplierId,items:lines,status:"draft",invoiceTotalPaisa:total,paidPaisa:0,
      note:data.note,createdBy:actor.id}],{session});
    await Audit.create([{actorId:actor.id,action:"purchase.created",entity:"PurchaseOrder",entityId:String(po._id),
      details:{items:lines.length,plannedTotalPaisa:total}}],{session});
    output={id:String(po._id),status:"draft",totalPaisa:total};
   },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});
  }finally{await session.endSession();}
  return Response.json(output,{status:201});
 }catch(e){return apiError(e);}
}
