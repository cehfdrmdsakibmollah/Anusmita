import {authorize,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {OfflineSale,PosCashReturn} from "@/lib/models";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  await authorize(["owner","admin","sales"],"orders.view");
  const {id}=await params;
  if(!/^[0-9a-f]{24}$/i.test(id))throw new HttpError(400,"Invalid invoice ID");
  await db();
  const invoice=await OfflineSale.findOne({_id:id,status:"completed"}).select("invoiceNumber branchId branchName cashierName customerName paymentMethod lines subtotalPaisa discountPaisa totalPaisa tenderedPaisa changePaisa createdAt refundedPaisa").lean<any>();
  if(!invoice)throw new HttpError(404,"Confirmed invoice not found");
  const refunds=await PosCashReturn.find({saleId:invoice._id}).select("createdAt refundedPaisa reason disposition").sort({createdAt:1}).lean<any[]>();
  return Response.json({
   id:String(invoice._id),invoiceNumber:invoice.invoiceNumber,branchName:invoice.branchName,cashierName:invoice.cashierName,
   customerName:invoice.customerName||"",paymentMethod:invoice.paymentMethod,
   date:invoice.createdAt,subtotalPaisa:invoice.subtotalPaisa,discountPaisa:invoice.discountPaisa,totalPaisa:invoice.totalPaisa,
   tenderedPaisa:invoice.tenderedPaisa,changePaisa:invoice.changePaisa,refundedPaisa:invoice.refundedPaisa||0,
   lines:invoice.lines.map((l:any)=>({name:l.name,sku:l.sku,quantity:l.quantity,unitPricePaisa:l.unitPricePaisa})),
   refunds:refunds.map(r=>({date:r.createdAt,amountPaisa:r.refundedPaisa,disposition:r.disposition})),
   reprint:true
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}