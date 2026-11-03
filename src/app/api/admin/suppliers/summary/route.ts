import {authorize,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Supplier,PurchaseOrder,PurchaseReceipt,SupplierPayment} from "@/lib/models";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  await authorize(["owner","admin","purchasing","finance"],"purchasing.view");
  await db();
  const [total,active,openOrders,commitment,topSuppliers,receipts,paid]=await Promise.all([
   Supplier.countDocuments({archivedAt:null}),
   Supplier.countDocuments({active:true,archivedAt:null}),
   PurchaseOrder.countDocuments({status:{$in:["draft","submitted","partially_received"]}}),
   PurchaseOrder.aggregate([{$match:{status:{$ne:"cancelled"}}},{$group:{_id:null,total:{$sum:"$invoiceTotalPaisa"},plannedPaid:{$sum:"$paidPaisa"}}}]),
   PurchaseOrder.aggregate([{$match:{status:{$ne:"cancelled"}}},{$group:{_id:"$supplierId",totalPaisa:{$sum:"$invoiceTotalPaisa"},paidPaisa:{$sum:"$paidPaisa"},orders:{$sum:1},lastOrderAt:{$max:"$createdAt"}}},{$sort:{totalPaisa:-1}},{$limit:15},{$lookup:{from:Supplier.collection.name,localField:"_id",foreignField:"_id",as:"supplier"}},{$unwind:{path:"$supplier",preserveNullAndEmptyArrays:true}},{$project:{id:{$toString:"$_id"},name:"$supplier.name",totalPaisa:1,paidPaisa:1,orders:1,lastOrderAt:1}}]),
   PurchaseReceipt.countDocuments(),
   SupplierPayment.aggregate([{$match:{status:"verified"}},{$group:{_id:null,amount:{$sum:"$amountPaisa"},count:{$sum:1}}}])
  ]);
  const c=commitment[0]||{total:0,plannedPaid:0};
  return Response.json({total,active,openOrders,plannedPurchasePaisa:c.total||0,recordedPoPaidPaisa:c.plannedPaid||0,remainingCommitmentPaisa:Math.max(0,(c.total||0)-(c.plannedPaid||0)),verifiedPaymentPaisa:paid[0]?.amount||0,verifiedPaymentCount:paid[0]?.count||0,receiptsRecorded:receipts,topSuppliers,note:"PO values are commitments, not verified vendor invoices or reconciled accounts payable. Supplier grading, on-time delivery, live FX and forecasts are unverified until event data exists."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e)}
}
