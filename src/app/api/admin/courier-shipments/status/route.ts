import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {CourierShipment,Audit} from "@/lib/models";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 try{
  assertOrigin(request);
  const actor=await authorize(["owner","admin","sales","support"],"orders.view");
  const body=await request.json();
  const orderId=body?.orderId;
  if(typeof orderId!=="string"||!mongoose.isValidObjectId(orderId)||Object.keys(body).some(k=>k!=="orderId"))throw new HttpError(400,"Invalid request");
  await db();
  const shipment=await CourierShipment.findOne({orderId,provider:"steadfast",state:"booked"});
  if(!shipment?.consignmentId)throw new HttpError(404,"No confirmed Steadfast booking");
  const key=process.env.STEADFAST_API_KEY,secret=process.env.STEADFAST_SECRET_KEY;
  if(!key||!secret)throw new HttpError(503,"Steadfast credentials unavailable");
  const cid=encodeURIComponent(shipment.consignmentId);
  const response=await fetch("https://portal.packzy.com/api/v1/status_by_cid/"+cid,{headers:{"Api-Key":key,"Secret-Key":secret,"Accept":"application/json"},signal:AbortSignal.timeout(15000),cache:"no-store"});
  const payload=await response.json().catch(()=>null);
  const value=payload?.delivery_status;
  if(!response.ok||typeof value!=="string"||!/^[a-z_]{2,60}$/.test(value))throw new HttpError(502,"Unable to verify provider status");
  await CourierShipment.updateOne({_id:shipment._id},{$set:{deliveryStatus:value,statusCheckedAt:new Date()}});
  await Audit.create({actorId:actor.id,action:"courier.steadfast.status_checked",entity:"Order",entityId:orderId,details:{deliveryStatus:value}});
  return Response.json({provider:"steadfast",deliveryStatus:value,checkedAt:new Date().toISOString(),note:"Provider delivery state only. No order fulfillment or payment settlement changed."},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e)}
}
