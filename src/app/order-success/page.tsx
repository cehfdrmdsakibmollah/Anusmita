import Link from "next/link";
import type {Metadata} from "next";
import {CheckCircle2,PackageCheck,ArrowRight,Printer,Truck,ShoppingBag} from "lucide-react";
import CommerceSteps from "@/components/commerce-steps";
import {db} from "@/lib/db";
import {Order} from "@/lib/models";
import {verifyOrderReceipt} from "@/lib/order-receipt";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Order acknowledgement | ANUSMITA",robots:{index:false,follow:false}};
export default async function OrderSuccess({searchParams}:{searchParams:Promise<{token?:string}>}){
 const token=(await searchParams).token||"";
 const id=token.length<1500?await verifyOrderReceipt(token):null;
 let order:null|{orderNumber:string;orderStatus:string;paymentStatus:string;totalPaisa:number}=null;
 if(id){try{await db();const doc=await Order.findById(id).select("orderNumber orderStatus paymentStatus totalPaisa").lean<any>();if(doc)order={orderNumber:doc.orderNumber,orderStatus:doc.orderStatus,paymentStatus:doc.paymentStatus,totalPaisa:doc.totalPaisa};}catch{}}
 return <main className="anWide anOrderReceipt anFlowReceipt">
  {order?<><CommerceSteps step={3}/><section className="anOrderReceiptCard">
   <CheckCircle2 size={45} aria-hidden="true"/><p className="anOverline">ANUSMITA · ORDER RECEIVED</p>
   <h1>Thank You for Your Order!</h1>
   <p>Your order was recorded successfully. Our team will review it before fulfilment. Payment and courier pickup are not automatically confirmed.</p>
   <dl><div><dt>Order reference</dt><dd>{order.orderNumber}</dd></div><div><dt>Order status</dt><dd>{order.orderStatus}</dd></div><div><dt>Payment status</dt><dd>{order.paymentStatus}</dd></div><div><dt>Recorded total</dt><dd>৳{(order.totalPaisa/100).toLocaleString("en-BD")}</dd></div></dl>
   <div className="anFlowStatus"><span><CheckCircle2 size={19}/> Recorded</span><span><PackageCheck size={19}/> Awaiting processing</span><span><Truck size={19}/> Not yet shipped</span></div>
   <div className="anOrderReceiptActions"><Link href={"/order-success/invoice?token="+encodeURIComponent(token)}><Printer size={18}/> Printable Invoice</Link><Link href="/track-order"><PackageCheck size={18}/> Track your order</Link><Link href="/shop"><ShoppingBag size={18}/> Continue shopping <ArrowRight size={18}/></Link></div>
   <small>Keep your order reference private. Tracking may require additional identity verification.</small>
  </section></>:<section className="anOrderReceiptCard"><h1>Order confirmation unavailable</h1><p>There is no verified order receipt for this link. No order or payment has been confirmed by this page.</p><Link href="/cart">Return to your bag <ArrowRight size={18}/></Link></section>}
 </main>;
}
