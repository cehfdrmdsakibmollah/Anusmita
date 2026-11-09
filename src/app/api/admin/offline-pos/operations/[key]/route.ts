import {authorize,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {OfflineSale} from "@/lib/models";
export const dynamic="force-dynamic";
export const runtime="nodejs";
/**
 * Read-only resolution for an uncertain POS POST.
 * The idempotency UUID is NOT authorization: the authenticated cashier must own it.
 */
export async function GET(_request:Request,{params}:{params:Promise<{key:string}>}){
 try{
  const actor=await authorize(["owner","admin","sales"],"orders.view");
  const {key}=await params;
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key))
   throw new HttpError(400,"Invalid checkout operation key");
  await db();
  const sale=await OfflineSale.findOne({operationKey:key,cashierId:actor.id,status:"completed"})
   .select("invoiceNumber branchId branchName cashierName customerName lines subtotalPaisa discountPaisa totalPaisa tenderedPaisa changePaisa createdAt")
   .lean<any>();
  if(!sale)return Response.json({status:"not_found",message:"No confirmed invoice found for this cashier and checkout key. It may still be processing; verify again before retrying."},
   {status:404,headers:{"Cache-Control":"private, no-store"}});
  return Response.json({status:"confirmed",invoice:{
   id:String(sale._id),invoiceNumber:sale.invoiceNumber,branchId:String(sale.branchId),
   branchName:sale.branchName,cashierName:sale.cashierName,customerName:sale.customerName||"",
   lines:sale.lines.map((l:any)=>({name:l.name,sku:l.sku,quantity:l.quantity,unitPricePaisa:l.unitPricePaisa})),
   subtotalPaisa:sale.subtotalPaisa,discountPaisa:sale.discountPaisa,totalPaisa:sale.totalPaisa,
   tenderedPaisa:sale.tenderedPaisa,changePaisa:sale.changePaisa,date:sale.createdAt
  }},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
