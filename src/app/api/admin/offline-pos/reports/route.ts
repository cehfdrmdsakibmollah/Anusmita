import mongoose from "mongoose";
import {authorize,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {OfflineSale,PosCashReturn,BranchDamage,PosCashShift,WarehouseLocation} from "@/lib/models";
import {bdBusinessDate} from "@/lib/offline-pos";
import {knownLineCost,posPeriodMargin} from "@/lib/pos-profit-report";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const validDate=(x:string)=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+"T00:00:00Z"));
export async function GET(request:Request){
 try{
  await authorize(["owner","admin","finance","analyst"],"finance.view");
  const q=new URL(request.url).searchParams;
  const branchId=q.get("branchId")||"";
  if(branchId&&!/^[a-f0-9]{24}$/i.test(branchId))throw new HttpError(400,"Invalid branch");
  const today=bdBusinessDate(new Date());
  const from=q.get("from")||today,to=q.get("to")||today;
  if(!validDate(from)||!validDate(to)||from>to||Date.parse(to+"T00:00:00Z")-Date.parse(from+"T00:00:00Z")>31*86400000)
   throw new HttpError(400,"Choose a valid date range of 32 days or fewer");
  await db();
  const branchFilter=branchId?{branchId:new mongoose.Types.ObjectId(branchId)}:{};
  const businessRange={businessDate:{$gte:from,$lte:to},...branchFilter};
  const [branches,sales,returns,damages,shifts,restocks]=await Promise.all([
   WarehouseLocation.find({}).select("name code active").sort({name:1}).limit(200).lean<any[]>(),
   OfflineSale.find(businessRange).select("invoiceNumber cashierId cashierName branchId branchName totalPaisa lines").lean<any[]>(),
   PosCashReturn.find(businessRange).select("invoiceNumber refundedPaisa lines inspectionState inspectedAt").lean<any[]>(),
   BranchDamage.find({...branchFilter,createdAt:{$gte:new Date(from+"T00:00:00+06:00"),$lt:new Date(new Date(to+"T00:00:00+06:00").getTime()+86400000)}})
    .select("unitCostPaisa quantity").lean<any[]>(),
   PosCashShift.find({...branchFilter,openedAt:{$gte:new Date(from+"T00:00:00+06:00"),$lt:new Date(new Date(to+"T00:00:00+06:00").getTime()+86400000)}})
    .select("status openingFloatPaisa closingCountPaisa variancePaisa").lean<any[]>(),
   PosCashReturn.find({...branchFilter,inspectionState:"restocked",inspectedAt:{$gte:new Date(from+"T00:00:00+06:00"),$lt:new Date(new Date(to+"T00:00:00+06:00").getTime()+86400000)}})
    .select("lines").lean<any[]>()
  ]);
  let salesPaisa=0,refundsPaisa=0,costOfGoodsPaisa=0,restockedCostPaisa=0,damageCostPaisa=0,costComplete=true,missingCostInvoices=0;
  const cashier=new Map<string,{cashierId:string;name:string;salesPaisa:number;orders:number;items:number}>();
  for(const s of sales){
   salesPaisa+=s.totalPaisa;
   const calc=knownLineCost(s.lines);
   if(!calc.complete){costComplete=false;missingCostInvoices++;}
   costOfGoodsPaisa+=calc.costPaisa;
   const id=String(s.cashierId),row=cashier.get(id)||{cashierId:id,name:s.cashierName,salesPaisa:0,orders:0,items:0};
   row.salesPaisa+=s.totalPaisa;row.orders++;row.items+=s.lines.reduce((n:number,l:any)=>n+l.quantity,0);cashier.set(id,row);
  }
  for(const r of returns)refundsPaisa+=r.refundedPaisa;
  for(const r of restocks){const c=knownLineCost(r.lines);if(!c.complete)costComplete=false;restockedCostPaisa+=c.costPaisa;}
  for(const d of damages){
   if(!Number.isSafeInteger(d.unitCostPaisa)||d.unitCostPaisa<0||!Number.isSafeInteger(d.quantity)){costComplete=false;continue;}
   damageCostPaisa+=d.unitCostPaisa*d.quantity;
  }
  const margin=posPeriodMargin({salesPaisa,refundsPaisa,costOfGoodsPaisa,restockedCostPaisa,damageCostPaisa,costComplete});
  return Response.json({
   from,to,branchId,scope:"POS cash sales only; excludes web orders, overhead, tax adjustments, commissions and external payment costs",
   branches:branches.map(b=>({id:String(b._id),name:b.name,code:b.code,active:b.active})),
   salesPaisa,refundsPaisa,costOfGoodsPaisa:costComplete?costOfGoodsPaisa:null,
   restockedCostPaisa:costComplete?restockedCostPaisa:null,damageCostPaisa:costComplete?damageCostPaisa:null,
   ...margin,grossContributionPaisa:costComplete?margin.grossContributionPaisa:null,
   costComplete,missingCostInvoices,invoiceCount:sales.length,refundCount:returns.length,
   cashier:[...cashier.values()].sort((a,b)=>b.salesPaisa-a.salesPaisa),
   shifts:{total:shifts.length,closed:shifts.filter(s=>s.status==="closed").length,
    totalAbsoluteVariancePaisa:shifts.filter(s=>s.status==="closed").reduce((v,s)=>v+Math.abs(s.variancePaisa||0),0)}
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
