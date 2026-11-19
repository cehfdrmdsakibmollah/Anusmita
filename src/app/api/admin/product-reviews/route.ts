import {z} from "zod";
import {assertOrigin,authorize,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Audit,ProductReview} from "@/lib/models";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const input=z.object({reviewId:z.string().regex(/^[a-f0-9]{24}$/i),decision:z.enum(["approved","rejected"])}).strict();

/** Moderation is a privileged action; customer submissions always begin pending. */
export async function GET(){
 try{
  await authorize(["owner","admin"],"products.view");
  await db();
  const reviews=await ProductReview.find({moderationStatus:"pending"})
   .select("_id productId orderId rating body skinType createdAt")
   .sort({createdAt:1}).limit(100).lean<any[]>();
  return Response.json({reviews:reviews.map(r=>({id:String(r._id),productId:String(r.productId),orderId:String(r.orderId),rating:r.rating,body:r.body,skinType:r.skinType,createdAt:r.createdAt}))},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiError(error);}
}
export async function POST(request:Request){
 try{
  assertOrigin(request);
  const actor=await authorize(["owner","admin"],"products.edit");
  if(Number(request.headers.get("content-length")||"0")>4000)throw new HttpError(413,"Payload too large");
  const data=input.parse(await request.json());
  await db();
  const record=await ProductReview.findOneAndUpdate({_id:data.reviewId,moderationStatus:"pending",consentToPublish:true,submittedByCustomer:true,verifiedPurchase:true,verifiedAt:{$type:"date"}},
   {$set:{moderationStatus:data.decision}},{new:true}).select("_id productId orderId moderationStatus").lean<any>();
  if(!record)throw new HttpError(409,"Review is already moderated or not eligible");
  await Audit.create({actorId:actor.id,action:"product.review.moderated",entity:"ProductReview",entityId:String(record._id),details:{decision:data.decision,productId:String(record.productId)}});
  return Response.json({id:String(record._id),status:record.moderationStatus},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return apiError(error);}
}
