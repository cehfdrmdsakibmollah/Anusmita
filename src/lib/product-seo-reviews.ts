import {ProductReview} from "@/lib/models";
/** SEO ratings must represent every approved, customer-submitted, verified-purchase review. */
export async function verifiedSeoReviewSummary(productId:unknown):Promise<{verifiedReviewCount:number;verifiedRatingValue:number}>{
 const result=await ProductReview.aggregate([
  {$match:{productId,moderationStatus:"approved",consentToPublish:true,submittedByCustomer:true,verifiedPurchase:true,verifiedAt:{$type:"date"},rating:{$gte:1,$lte:5}}},
  {$group:{_id:null,reviewCount:{$sum:1},ratingValue:{$avg:"$rating"}}}
 ]);
 const row=result[0];
 return {verifiedReviewCount:Math.max(0,Number(row?.reviewCount||0)),verifiedRatingValue:Number(row?.ratingValue||0)};
}
