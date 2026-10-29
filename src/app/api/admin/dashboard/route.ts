import {authorize,apiError,HttpError} from '@/lib/auth';
import {db} from '@/lib/db';
import {Order,Product,Payment,PurchaseOrder} from '@/lib/models';
import {dashboardWindow,fillDailySeries} from '@/lib/dashboard-metrics';
export const dynamic='force-dynamic';
const validOrder={isTest:false,orderStatus:{$nin:['cancelled','returned']}};
const openPurchase={status:{$in:['submitted','partially_received','received']}};
const dateGroup=(field:string)=>({$dateToString:{format:'%Y-%m-%d',date:field,timezone:'Asia/Dhaka'}});
export async function GET(request:Request) {
 try {
  await authorize(['owner','admin','finance','analyst']);
  const raw=new URL(request.url).searchParams.get('days')??'7';
  if(raw!=='7'&&raw!=='14')throw new HttpError(400,'Chart range must be 7 or 14 days');
  const days=Number(raw) as 7|14;
  const now=new Date();const {today,start,end}=dashboardWindow(now,days);
  await db();
  // Aggregate on the server; return no customer PII; bound execution time.
  const [sales,payments,inventory,purchases,queue]=await Promise.all([
   Order.aggregate([{$match:{...validOrder,createdAt:{$gte:start,$lte:end}}},{$group:{_id:dateGroup('$createdAt'),total:{$sum:'$totalPaisa'}}}]).option({maxTimeMS:10000}),
   Payment.aggregate([
    {$match:{status:'verified',direction:{$in:['collection','refund']},verifiedAt:{$lte:end}}},
    {$lookup:{from:Order.collection.name,localField:'orderId',foreignField:'_id',as:'order',pipeline:[{$project:{isTest:1}}]}},
    {$match:{'order.0.isTest':false}},
    {$set:{signedAmount:{$cond:[{$eq:['$direction','refund']},{$multiply:['$amountPaisa',-1]},'$amountPaisa']}}},
    {$facet:{total:[{$group:{_id:null,total:{$sum:'$signedAmount'}}}],daily:[{$match:{verifiedAt:{$gte:start}}},{$group:{_id:dateGroup('$verifiedAt'),total:{$sum:'$signedAmount'}}}]}}
   ]).option({maxTimeMS:10000}),
   Product.aggregate([{$group:{_id:null,
    available:{$sum:{$cond:['$active',{$max:[0,{$subtract:['$onHand','$reserved']}]},0]}},
    reserved:{$sum:'$reserved'},
    low:{$sum:{$cond:[{$and:['$active',{$lte:[{$subtract:['$onHand','$reserved']},'$reorderLevel']}]},1,0]}}
   }}]).option({maxTimeMS:10000}),
   PurchaseOrder.aggregate([{$match:openPurchase},{$facet:{
    balances:[{$match:{$expr:{$gt:['$invoiceTotalPaisa','$paidPaisa']}}},{$count:'count'}],
    incoming:[{$match:{status:{$in:['submitted','partially_received']}}},{$unwind:'$items'},{$group:{_id:null,units:{$sum:{$max:[0,{$subtract:['$items.quantity','$items.received']}]}}}}]
   }}]).option({maxTimeMS:10000}),
   Order.aggregate([{$match:validOrder},{$group:{_id:null,
    today:{$sum:{$cond:[{$and:[{$gte:['$createdAt',today]},{$lte:['$createdAt',end]}]},1,0]}},
    awaiting:{$sum:{$cond:[{$eq:['$orderStatus','placed']},1,0]}},
    unpaidTransfers:{$sum:{$cond:[{$and:[{$ne:['$paymentMethod','cod']},{$in:['$paymentStatus',['unpaid','partial']]}]},1,0]}}
   }}]).option({maxTimeMS:10000})
  ]);
  return Response.json({todayOrders:queue[0]?.today??0,awaitingConfirmation:queue[0]?.awaiting??0,unpaidTransferOrders:queue[0]?.unpaidTransfers??0,
   availableUnits:inventory[0]?.available??0,reservedUnits:inventory[0]?.reserved??0,lowStockSkus:inventory[0]?.low??0,
   incomingUnits:purchases[0]?.incoming[0]?.units??0,supplierInvoicesOutstanding:purchases[0]?.balances[0]?.count??0,
   netCollectionsPaisa:payments[0]?.total[0]?.total??0,series:fillDailySeries(start,days,sales,payments[0]?.daily??[]),generatedAt:now.toISOString()
  },{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return apiError(e);}
}
