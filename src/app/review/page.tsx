import type {Metadata} from "next";
import Link from "next/link";
import VerifiedReviewForm from "@/components/verified-review-form";
import {verifyReviewInvite} from "@/lib/review-invite";
import {checkoutEnabled} from "@/lib/launch-config";
import {db} from "@/lib/db";
import {Order,Product,ProductReview} from "@/lib/models";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Verified purchase review | ANUSMITA",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function ReviewPage({searchParams}:{searchParams:Promise<{token?:string}>}){
 const token=(await searchParams).token||"";
 let name:string|null=null,already=false;
 if(checkoutEnabled(process.env)){
  const invite=await verifyReviewInvite(token);
  if(invite)try{
   await db();
   const [order,product,review]=await Promise.all([
    Order.exists({_id:invite.orderId,orderStatus:"delivered","lines.productId":invite.productId}),
    Product.findOne({_id:invite.productId,active:true}).select("name").lean<{name:string}|null>(),
    ProductReview.exists({orderId:invite.orderId,productId:invite.productId})
   ]);
   if(order&&product){name=product.name;already=Boolean(review);}
  }catch{}
 }
 if(!name||already)return <main className="anWide" style={{maxWidth:650,padding:"70px 20px"}}><h1>{already?"Review already submitted":"Review invitation unavailable"}</h1><p>{already?"This purchase has already received a review.":"This link may have expired, the order may not yet be delivered, or reviews may be temporarily unavailable."}</p><Link href="/shop">Return to shop</Link></main>;
 return <VerifiedReviewForm token={token} productName={name}/>;
}
