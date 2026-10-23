
import { authorize,apiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { Order,Product,Payment,Expense,PurchaseOrder,SupplierPayment } from "@/lib/models";
export const dynamic="force-dynamic";
export async function GET() {
 try{
  await authorize(["owner","admin","finance","analyst"]);
  await db();
  const [orders,products,collections,expenses,payables,supplierPayments]=await Promise.all([
   Order.find({isTest:false}).select("orderStatus subtotalPaisa shippingPaisa totalPaisa collectedPaisa lines").lean(),
   Product.find({}).select("onHand reserved costPaisa reorderLevel active").lean(),
   Payment.aggregate([{$match:{status:"verified",direction:"collection"}},{$group:{_id:null,total:{$sum:"$amountPaisa"}}}]),
   Expense.aggregate([{$group:{_id:null,total:{$sum:"$amountPaisa"}}}]),
   PurchaseOrder.aggregate([{$match:{status:{$in:["submitted","partially_received","received"]}}},{$group:{_id:null,total:{$sum:{$subtract:["$invoiceTotalPaisa","$paidPaisa"]}}}}]),
   SupplierPayment.aggregate([{$match:{status:"verified"}},{$group:{_id:null,total:{$sum:"$amountPaisa"}}}])
  ]);
  const valid=orders.filter((o:any)=>!["cancelled","returned"].includes(o.orderStatus));
  const confirmed=valid.filter((o:any)=>["confirmed","packed","shipped","delivered"].includes(o.orderStatus));
  const delivered=valid.filter((o:any)=>o.orderStatus==="delivered");
  const sum=(a:any[],field:string)=>a.reduce((n,o)=>n+(o[field]||0),0);
  const deliveredSalesPaisa=sum(delivered,"totalPaisa");
  const cogsPaisa=delivered.reduce((n:number,o:any)=>n+o.lines.reduce((m:number,l:any)=>m+l.unitCostPaisa*l.quantity,0),0);
  const expensePaisa=expenses[0]?.total||0;
  return Response.json({
   orderedPaisa:sum(valid,"totalPaisa"),confirmedPaisa:sum(confirmed,"totalPaisa"),
   deliveredSalesPaisa,recordedCollectionsPaisa:collections[0]?.total||0,
   outstandingPaisa:valid.reduce((n:any,o:any)=>n+Math.max(0,o.totalPaisa-o.collectedPaisa),0),
   supplierPayablePaisa:payables[0]?.total||0,
   supplierPaidPaisa:supplierPayments[0]?.total||0,cogsPaisa,recordedExpensePaisa:expensePaisa,
   estimatedGrossProfitPaisa:deliveredSalesPaisa-cogsPaisa,
   estimatedOperatingProfitPaisa:deliveredSalesPaisa-cogsPaisa-expensePaisa,
   unreconciled:true, // fees, tax, outstanding invoices and refunds require reconciliation
   placedOrders:valid.length,deliveredOrders:delivered.length,
   lowStockSkus:products.filter((p:any)=>p.active&&p.onHand-p.reserved<=p.reorderLevel).length,
   reservedUnits:products.reduce((n:number,p:any)=>n+p.reserved,0),
   inventoryCostPaisa:products.reduce((n:number,p:any)=>n+p.onHand*p.costPaisa,0)
  },{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
