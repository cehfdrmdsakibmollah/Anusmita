
import { createOrder } from "@/lib/commerce";
import { assertOrigin,apiError,HttpError } from "@/lib/auth";
import {checkoutEnabled} from "@/lib/launch-config";
import {db} from "@/lib/db";
import {User} from "@/lib/models";
export const runtime="nodejs";
export async function POST(request:Request) {
 try {
  assertOrigin(request);
  if(!checkoutEnabled(process.env))throw new HttpError(503,"ANUSMITA checkout is closed until launch configuration is complete");
  await db();
  if(!await User.exists({role:"owner",active:true}))throw new HttpError(503,"ANUSMITA owner setup is incomplete");
  const key=request.headers.get("Idempotency-Key")||"";
  if(Number(request.headers.get("content-length")||"0")>30000) return Response.json({error:"Payload too large"},{status:413});
  const order=await createOrder(await request.json(),key);
  return Response.json({id:String(order._id),orderNumber:order.orderNumber,status:order.orderStatus,paymentStatus:order.paymentStatus,totalPaisa:order.totalPaisa,collectedPaisa:order.collectedPaisa},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
