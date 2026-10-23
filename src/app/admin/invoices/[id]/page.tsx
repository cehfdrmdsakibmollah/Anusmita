
import mongoose from "mongoose";
import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {Order} from "@/lib/models";
import {taka} from "@/lib/money";
import PrintToolbar from "@/components/print-toolbar";
export const dynamic="force-dynamic";
export const metadata={title:"Printable Order Receipt",robots:{index:false,follow:false}};
export default async function ReceiptPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{format?:string}>}){
 const user=await currentUser();
 if(!user)redirect("/admin/login");
 if(!["owner","admin","sales","finance","support"].includes(user.role))notFound();
 const {id}=await params,{format}=await searchParams;
 if(!mongoose.isValidObjectId(id))notFound();
 await db();const order=await Order.findById(id).lean<any>();
 if(!order)notFound();
 const size=format==="58"?"receipt58":format==="80"?"receipt80":"";
 return <div className="container"><div className="noPrint" style={{marginTop:24}}>
 <Link href="/admin">← Back to dashboard</Link><PrintToolbar/>
 <p className="smallprint">This is an order receipt/summary, not an issued tax invoice. Select the actual printer paper size when printing; no new transaction is recorded.</p>
 </div><article className={"printSheet "+size}>
 <div className="invoiceHeader"><div><h1 style={{fontFamily:"Georgia,serif",margin:"0 0 6px"}}>ANUSMITA</h1><small>FASHION · JEWELLERY · BEAUTY</small></div><div style={{textAlign:"right"}}><strong>ORDER RECEIPT</strong><p>{order.orderNumber}</p><small>{new Date(order.createdAt).toLocaleString("en-BD")}</small></div></div>
 <p><strong>Customer</strong><br/>{order.customer.name}<br/>{order.customer.phone}<br/>{order.customer.address}, {order.customer.area}, {order.customer.district}</p>
 <table><thead><tr><th>Product / SKU</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>{order.lines.map((l:any,i:number)=><tr key={i}><td>{l.name}<br/><small>{l.sku}</small></td><td>{l.quantity}</td><td>{taka(l.unitPricePaisa)}</td><td>{taka(l.lineTotalPaisa)}</td></tr>)}</tbody></table>
 <div className="invoiceTotal"><p>Subtotal: {taka(order.subtotalPaisa)}</p><p>Delivery: {taka(order.shippingPaisa)}</p><h3>Total: {taka(order.totalPaisa)}</h3><p>Received: {taka(order.collectedPaisa)}</p><strong>Outstanding: {taka(Math.max(0,order.totalPaisa-order.collectedPaisa))}</strong></div>
 <hr/><p><small>Order status: {order.orderStatus} • Payment status: {order.paymentStatus} • Method: {order.paymentMethod}</small></p><p><small>Thank you for supporting ANUSMITA.</small></p>
 </article></div>;
}
