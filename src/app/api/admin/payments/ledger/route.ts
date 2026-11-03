import {authorize,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Order,Payment,SupplierPayment} from "@/lib/models";
import {Types} from "mongoose";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
const escapeRegex=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
const dateOrNull=(value:string|null)=>{if(!value)return null;const d=new Date(value);if(!Number.isFinite(d.getTime()))throw new HttpError(400,"Invalid date");return d};
export async function GET(request:Request){
 try{
  await authorize(["owner","admin","finance","analyst"],"finance.view");
  const q=new URL(request.url).searchParams;
  const page=Math.min(10000,Math.max(1,Number(q.get("page"))||1));
  const size=[8,10,20].includes(Number(q.get("size")))?Number(q.get("size")):10;
  const method=q.get("method")||"all";
  const direction=q.get("direction")||"all";
  const query=(q.get("q")||"").trim().slice(0,100);
  if(!["all","cash","cod","bank_transfer","bkash_manual","nagad_manual"].includes(method))throw new HttpError(400,"Invalid payment method");
  if(!["all","collection","refund"].includes(direction))throw new HttpError(400,"Invalid direction");
  const from=dateOrNull(q.get("from")),to=dateOrNull(q.get("to"));
  if(from&&to&&from>to)throw new HttpError(400,"Invalid date range");
  await db();
  const filter:any={};
  if(method!=="all")filter.method=method;
  if(direction!=="all")filter.direction=direction;
  if(from||to)filter.verifiedAt={...(from?{$gte:from}:{}),...(to?{$lte:to}:{})};
  let matches:Types.ObjectId[]|null=null;
  if(query){
   const expr=new RegExp(escapeRegex(query),"i");
   const orders=await Order.find({$or:[{orderNumber:expr},{"customer.name":expr},{"customer.phone":expr}]}).select("_id").limit(1000).lean<any[]>();
   matches=orders.map(x=>x._id);
   filter.$or=[{reference:expr},{orderId:{$in:matches}}];
  }
  const [payments,total,overview,byMethod,orderSummary,supplierPaid,trend,exceptions]=await Promise.all([
   Payment.find(filter).sort({verifiedAt:-1,_id:-1}).skip((page-1)*size).limit(size).populate({path:"orderId",select:"orderNumber totalPaisa collectedPaisa paymentStatus customer.name customer.phone"}).lean<any[]>(),
   Payment.countDocuments(filter),
   Payment.aggregate([{$group:{_id:{direction:"$direction",status:"$status"},amount:{$sum:"$amountPaisa"},count:{$sum:1}}}]),
   Payment.aggregate([{$match:{direction:"collection",status:"verified"}},{$group:{_id:"$method",amount:{$sum:"$amountPaisa"},count:{$sum:1}}},{$sort:{amount:-1}}]),
   Order.aggregate([{$match:{isTest:{$ne:true},orderStatus:{$nin:["cancelled"]}}},{$group:{_id:null,total:{$sum:"$totalPaisa"},collected:{$sum:"$collectedPaisa"},unpaidOrders:{$sum:{$cond:[{$lt:["$collectedPaisa","$totalPaisa"]},1,0]}}}}]),
   SupplierPayment.aggregate([{$match:{status:"verified"}},{$group:{_id:null,amount:{$sum:"$amountPaisa"},count:{$sum:1}}}]),
   Payment.aggregate([{$match:{direction:"collection",status:"verified",verifiedAt:{$gte:new Date(new Date().getFullYear()-1,new Date().getMonth()+1,1)}}},{$group:{_id:{$dateToString:{format:"%Y-%m",date:"$verifiedAt",timezone:"Asia/Dhaka"}},amount:{$sum:"$amountPaisa"},count:{$sum:1}}},{$sort:{_id:1}}]),
   Order.countDocuments({isTest:{$ne:true},orderStatus:{$nin:["cancelled"]},paymentStatus:{$in:["unpaid","partial"]}})
  ]);
  const collection=overview.find(x=>x._id.direction==="collection"&&x._id.status==="verified")?.amount||0;
  const refunds=overview.filter(x=>x._id.direction==="refund"&&x._id.status==="verified").reduce((sum,x)=>sum+x.amount,0);
  const reversed=overview.filter(x=>x._id.status==="reversed").reduce((sum,x)=>sum+x.amount,0);
  return Response.json({
   rows:payments.map(x=>({id:String(x._id),orderId:x.orderId?._id?String(x.orderId._id):String(x.orderId||""),orderNumber:x.orderId?.orderNumber||"Order unavailable",customerName:x.orderId?.customer?.name||"",customerPhone:x.orderId?.customer?.phone||"",method:x.method,reference:x.reference,amountPaisa:x.amountPaisa,direction:x.direction,status:x.status,verifiedAt:x.verifiedAt,note:x.note||"",balancePaisa:typeof x.orderId?.totalPaisa==="number"?Math.max(0,x.orderId.totalPaisa-(x.orderId.collectedPaisa||0)):null})),
   total,page,size,pages:Math.max(1,Math.ceil(total/size)),
   metrics:{verifiedCollectionsPaisa:collection,recordedRefundsPaisa:refunds,netRecordedPaisa:collection-refunds,reversedPaisa:reversed,unpaidOrderCount:exceptions,orderBalancePaisa:Math.max(0,(orderSummary[0]?.total||0)-(orderSummary[0]?.collected||0)),supplierVerifiedPaidPaisa:supplierPaid[0]?.amount||0,methodBreakdown:byMethod,trend,recordCount:overview.reduce((sum,x)=>sum+x.count,0)},
   readiness:{gatewayReconciliation:"not_verified",bankSettlement:"not_verified",gatewayFees:"not_configured",pendingManualClaims:"no_verified_claim_source"},
   note:"This is an internal recorded-payment ledger. Manual verified means staff attested to provider/cash evidence; it is not independent gateway verification. No gateway payouts, reconciliation, net bank settlement or fees are inferred."
  },{headers});
 }catch(e){return apiError(e)}
}