import mongoose from "mongoose";
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Order,CourierShipment,Audit} from "@/lib/models";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const input=z.object({orderId:z.string().regex(/^[a-f0-9]{24}$/i),provider:z.literal("steadfast")}).strict();
export async function GET(request:Request){
 try{
  await authorize(["owner","admin","sales","support"],"orders.view");
  const id=new URL(request.url).searchParams.get("orderId")||"";
  if(!mongoose.isValidObjectId(id))throw new HttpError(400,"Invalid order ID");
  await db();
  const item=await CourierShipment.findOne({orderId:id}).select("provider state consignmentId trackingCode codPaisa responseAt errorCode").lean<any>();
  return Response.json({shipment:item||null},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e)}
}
export async function POST(request:Request){
 try{
  assertOrigin(request);
  const actor=await authorize(["owner","admin","sales"],"orders.edit");
  const {orderId}=input.parse(await request.json());
  const key=process.env.STEADFAST_API_KEY,secret=process.env.STEADFAST_SECRET_KEY;
  if(!key||!secret)throw new HttpError(503,"Steadfast merchant credentials are not configured");
  await db();
  const order=await Order.findById(orderId).lean<any>();
  if(!order)throw new HttpError(404,"Order not found");
  if(order.isTest)throw new HttpError(409,"Test orders cannot be dispatched");
  if(order.orderStatus!=="packed")throw new HttpError(409,"Only packed orders can be booked");
  const customer=order.customer||{};
  if(!customer.name?.trim()||!customer.phone?.trim()||!customer.address?.trim())throw new HttpError(422,"Customer name, phone and delivery address required");
  const outstanding=order.totalPaisa-order.collectedPaisa;
  if(!Number.isSafeInteger(outstanding)||outstanding<0)throw new HttpError(409,"Invalid outstanding balance");
  // The unique orderId index ensures only one external booking attempt per order.
  // If a provider responds ambiguously, an operator must reconcile manually.
  try{await CourierShipment.create({orderId,provider:"steadfast",state:"processing",codPaisa:outstanding,requestedBy:actor.id})}
  catch(e:any){if(e?.code===11000)throw new HttpError(409,"Shipment exists or needs review; cannot safely book twice");throw e}
  const shipment=await CourierShipment.findOne({orderId});
  try{
   const result=await fetch("https://portal.packzy.com/api/v1/create_order",{
    method:"POST",headers:{"Content-Type":"application/json","Api-Key":key,"Secret-Key":secret},
    body:JSON.stringify({invoice:order.orderNumber,recipient_name:customer.name,recipient_phone:customer.phone,recipient_address:[customer.address,customer.area,customer.district].filter(Boolean).join(", "),cod_amount:outstanding/100,note:"ANUSMITA verified merchant shipment"}),
    signal:AbortSignal.timeout(18000)
   });
   const payload=await result.json().catch(()=>null);
   const consignment=payload?.consignment;
   const consignmentId=String(consignment?.consignment_id||"");
   if(!result.ok||!consignmentId)throw new Error("Provider response requires manual reconciliation");
   const trackingCode=String(consignment?.tracking_code||"");
   await CourierShipment.updateOne({_id:shipment!._id,state:"processing"},{$set:{state:"booked",consignmentId,trackingCode,responseAt:new Date()}});
   await Audit.create({actorId:actor.id,action:"courier.steadfast.booked",entity:"Order",entityId:orderId,details:{consignmentId,codPaisa:outstanding}});
   return Response.json({booked:true,consignmentId,trackingCode,codPaisa:outstanding},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch{
   await CourierShipment.updateOne({_id:shipment!._id,state:"processing"},{$set:{state:"needs_review",errorCode:"ambiguous_provider_response",responseAt:new Date()}}).catch(()=>{});
   await Audit.create({actorId:actor.id,action:"courier.steadfast.needs_review",entity:"Order",entityId:orderId,details:{reason:"Provider request failed or confirmation unavailable"}}).catch(()=>{});
   throw new HttpError(502,"Courier booking confirmation unavailable. Check Steadfast merchant portal before attempting anything else; booking is locked against duplicates.");
  }
 }catch(e){return apiError(e)}
}
