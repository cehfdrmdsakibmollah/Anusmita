
import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { db } from "@/lib/db";
import { Product, Order, Counter, StockMovement, Audit } from "@/lib/models";
import { checkoutSchema } from "@/lib/validation";
import { HttpError } from "@/lib/auth";
import { cartTotals } from "@/lib/money";

export function shippingFor(district:string) {
 const raw=(district.toLowerCase().trim()==="dhaka"?process.env.SHIPPING_DHAKA_PAISA:process.env.SHIPPING_OTHER_PAISA) || (district.toLowerCase().trim()==="dhaka"?"7000":"12000");
 const amount=Number(raw);
 if(!Number.isSafeInteger(amount)||amount<0) throw new Error("Bad shipping configuration");
 return amount;
}
export async function createOrder(input:unknown,idempotencyKey:string) {
 const data=checkoutSchema.parse(input);
 if(!/^[a-zA-Z0-9_-]{12,128}$/.test(idempotencyKey)) throw new HttpError(400,"Valid Idempotency-Key required (12-128 characters)");
 const ids=data.items.map(x=>x.productId);
 if(new Set(ids).size!==ids.length) throw new HttpError(400,"Duplicate product line");
 const hash=createHash("sha256").update(JSON.stringify(data)).digest("hex");
 await db();
 const existing=await Order.findOne({idempotencyKey}).lean<any>();
 if(existing) {
   if(existing.requestHash!==hash) throw new HttpError(409,"Idempotency key already used for a different order");
   return existing;
 }
 const session=await mongoose.startSession();
 let placed:any;
 try {
  await session.withTransaction(async()=>{
   const old=await Order.findOne({idempotencyKey}).session(session).lean<any>();
   if(old) { if(old.requestHash!==hash) throw new HttpError(409,"Idempotency conflict"); placed=old; return; }
   const lines:any[]=[];
   for(const item of data.items){
    const product=await Product.findOneAndUpdate({_id:item.productId,active:true,$expr:{$gte:[{$subtract:["$onHand","$reserved"]},item.quantity]}},{$inc:{reserved:item.quantity}},{new:true,session});
    if(!product) throw new HttpError(409,"Product unavailable or insufficient stock");
    lines.push({productId:product._id,sku:product.sku,name:product.name,quantity:item.quantity,unitPricePaisa:product.pricePaisa,unitCostPaisa:product.costPaisa,lineTotalPaisa:product.pricePaisa*item.quantity});
   }
   const totals=cartTotals(lines,shippingFor(data.customer.district));
   if(data.depositPaisa>totals.totalPaisa) throw new HttpError(400,"Deposit exceeds order total");
   if(data.paymentMethod==="cod" && data.depositPaisa>0) throw new HttpError(400,"COD deposit requires a separate payment method");
   const counter=await Counter.findOneAndUpdate({key:"orders"},{$inc:{value:1}},{upsert:true,new:true,session,setDefaultsOnInsert:true});
   const num="AN-"+new Date().getUTCFullYear()+"-"+String(counter.value).padStart(6,"0");
   const [order]=await Order.create([{orderNumber:num,idempotencyKey,requestHash:hash,lines,customer:data.customer,paymentMethod:data.paymentMethod,depositPaisa:data.depositPaisa,...totals}],{session});
   for(const line of lines) await StockMovement.create([{productId:line.productId,orderId:order._id,type:"reserve",deltaReserved:line.quantity,note:"Checkout reserved stock"}],{session});
   await Audit.create([{action:"checkout.created",entity:"Order",entityId:String(order._id),details:{orderNumber:num}}],{session});
   placed=order.toObject();
  },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});
 } catch(e:any) {
  if(e?.code===11000) {
   const duplicate=await Order.findOne({idempotencyKey}).lean<any>();
   if(duplicate) { if(duplicate.requestHash!==hash) throw new HttpError(409,"Idempotency conflict"); return duplicate; }
  }
  throw e;
 } finally {await session.endSession();}
 if(!placed) throw new Error("Order transaction did not complete");
 return placed;
}
