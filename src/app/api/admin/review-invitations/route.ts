import {z} from "zod";
import {assertOrigin,authorize,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Order,Product,ProductReview} from "@/lib/models";
import {signReviewInvite} from "@/lib/review-invite";
import {checkoutEnabled} from "@/lib/launch-config";
export const runtime="nodejs";
const input=z.object({orderId:z.string().regex(/^[0-9a-f]{24}$/i),productId:z.string().regex(/^[0-9a-f]{24}$/i)}).strict();

/** Staff issues an invitation only after confirming fulfilment to the real buyer. */
export async function POST(request:Request){
 try{
  assertOrigin(request);
  const actor=await authorize(["owner","admin","support"],"orders.view");
  if(!checkoutEnabled(process.env))throw new HttpError(503,"Review invitations unavailable while store is in catalogue mode");
  if(Number(request.headers.get("content-length")||"0")>4000)throw new HttpError(413,"Payload too large");
  const data=input.parse(await request.json());
  await db();
  const order=await Order.findOne({_id:data.orderId,orderStatus:"delivered","lines.productId":data.productId}).select("_id customer.phone").lean<any>();
  if(!order)throw new HttpError(404,"No delivered purchase of this product on the specified order");
  if(!await Product.exists({_id:data.productId,active:true}))throw new HttpError(404,"Product unavailable");
  if(await ProductReview.exists({orderId:data.orderId,productId:data.productId}))throw new HttpError(409,"A review already exists for this purchase");
  const token=await signReviewInvite(data.orderId,data.productId);
  const base=new URL(process.env.NEXT_PUBLIC_SITE_URL!);
  const url=new URL("/review",base);
  url.searchParams.set("token",token);
  return Response.json({reviewUrl:url.toString(),validFor:"7 days",status:"invitation-created",issuedBy:actor.id},{headers:{"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
 }catch(error){return apiError(error);}
}
