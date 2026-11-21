import {z} from "zod";
import {assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Order,Product,ProductReview} from "@/lib/models";
import {verifyReviewInvite} from "@/lib/review-invite";
import {checkoutEnabled} from "@/lib/launch-config";
export const runtime="nodejs";
const schema=z.object({
 token:z.string().min(10).max(1800),
 rating:z.number().int().min(1).max(5),
 body:z.string().trim().min(10).max(1500),
 skinType:z.string().trim().max(60).default(""),
 consentToPublish:z.literal(true),
}).strict();
export async function POST(request:Request){
 try{
  assertOrigin(request);
  if(!checkoutEnabled(process.env))throw new HttpError(503,"Review submission not available in catalogue mode");
  if(Number(request.headers.get("content-length")||"0")>6000)throw new HttpError(413,"Payload too large");
  const data=schema.parse(await request.json());
  const invite=await verifyReviewInvite(data.token);
  if(!invite)throw new HttpError(403,"Review invitation invalid or expired");
  await db();
  const order=await Order.findOne({_id:invite.orderId,orderStatus:"delivered","lines.productId":invite.productId}).select("_id").lean();
  if(!order||!await Product.exists({_id:invite.productId,active:true}))throw new HttpError(403,"Delivered purchase verification failed");
  try{
   await ProductReview.create({orderId:invite.orderId,productId:invite.productId,rating:data.rating,body:data.body,skinType:data.skinType,consentToPublish:true,submittedByCustomer:true,verifiedPurchase:true,verifiedAt:new Date(),moderationStatus:"pending",photoUrls:[]});
  }catch(error){
   if(error&&typeof error==="object"&&"code" in error&&(error as {code?:number}).code===11000)throw new HttpError(409,"You have already submitted a review for this purchase");
   throw error;
  }
  return Response.json({status:"pending_moderation",message:"Thank you. Your review was received and is awaiting moderation."},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){return apiError(error);}
}
