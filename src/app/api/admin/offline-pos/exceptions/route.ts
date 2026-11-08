import {authorize,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {OfflineSale,PosCashReturn,PosCashShift,BranchDamage,JournalEntry} from "@/lib/models";
import {bdBusinessDate} from "@/lib/offline-pos";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const iso=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+"T00:00:00Z"));
type Finding={code:string;severity:"warning"|"critical";reference:string;detail:string};
export async function GET(request:Request){
 try{
  await authorize(["owner","admin","finance","analyst"],"finance.view");
  const params=new URL(request.url).searchParams,day=params.get("day")||bdBusinessDate(new Date());
  if(!iso(day))throw new HttpError(400,"Invalid business date");
  await db();
  // Bounded read-only scan; never repair financial or stock events automatically.
  const [sales,refunds,shifts,damages]=await Promise.all([
   OfflineSale.find({businessDate:day}).sort({createdAt:-1}).limit(400).select("_id invoiceNumber shiftId cashierId branchId totalPaisa commissionPaisa lines").lean<any[]>(),
   PosCashReturn.find({businessDate:day}).sort({createdAt:-1}).limit(400).select("_id invoiceNumber shiftId saleId refundedPaisa").lean<any[]>(),
   PosCashShift.find({openedAt:{$gte:new Date(day+"T00:00:00+06:00"),$lt:new Date(new Date(day+"T00:00:00+06:00").getTime()+86400000)}}).limit(400)
    .select("_id openingFloatPaisa cashSalesPaisa cashRefundsPaisa expectedCashPaisa closingCountPaisa variancePaisa status").lean<any[]>(),
   BranchDamage.find({createdAt:{$gte:new Date(day+"T00:00:00+06:00"),$lt:new Date(new Date(day+"T00:00:00+06:00").getTime()+86400000)}}).limit(400).select("_id quantity unitCostPaisa sku").lean<any[]>()
  ]);
  const expectedJournalKeys=[...sales.map(x=>"pos:sale:"+String(x._id)),...refunds.map(x=>"pos:refund:"+String(x._id)),...damages.filter(x=>Number(x.unitCostPaisa)>0).map(x=>"pos:damage:"+String(x._id))];
  const journals=await JournalEntry.find({entryKey:{$in:expectedJournalKeys}}).select("entryKey lines totalPaisa").lean<any[]>();
  const posted=new Map(journals.map(j=>[j.entryKey,j]));
  const findings:Finding[]=[];
  for(const key of expectedJournalKeys){
   const j=posted.get(key);
   if(!j){findings.push({code:"JOURNAL_MISSING",severity:"critical",reference:key,detail:"No balanced POS posting found for this confirmed transaction"});continue;}
   const debit=j.lines.reduce((n:number,l:any)=>n+l.debitPaisa,0),credit=j.lines.reduce((n:number,l:any)=>n+l.creditPaisa,0);
   if(debit!==credit||debit!==j.totalPaisa)findings.push({code:"JOURNAL_IMBALANCE",severity:"critical",reference:key,detail:"Ledger debit, credit, and posting amount disagree"});
  }
  for(const s of sales){
   if(!s.shiftId)findings.push({code:"SHIFT_LINK_MISSING",severity:"warning",reference:s.invoiceNumber,detail:"Invoice lacks a cashier shift reference (may be a legacy transaction)"});
   if(s.lines.some((l:any)=>l.unitCostPaisa==null))findings.push({code:"COST_UNKNOWN",severity:"warning",reference:s.invoiceNumber,detail:"Invoice contains unvalued product cost; profit contribution is unknown"});
  }
  for(const shift of shifts){
   const expected=(shift.openingFloatPaisa||0)+(shift.cashSalesPaisa||0)-(shift.cashRefundsPaisa||0);
   if(expected!==shift.expectedCashPaisa)findings.push({code:"DRAWER_BALANCE_MISMATCH",severity:"critical",reference:String(shift._id),detail:"Persisted expected drawer does not match opening cash plus sales minus refunds"});
   if(shift.status==="closed"&&shift.closingCountPaisa!=null&&shift.variancePaisa!==shift.closingCountPaisa-expected)findings.push({code:"DRAWER_VARIANCE_MISMATCH",severity:"critical",reference:String(shift._id),detail:"Closing variance differs from counted cash minus expected"});
  }
  const truncated=[sales,refunds,shifts,damages].some(x=>x.length===400);
  return Response.json({day,truncated,scanned:{sales:sales.length,refunds:refunds.length,shifts:shifts.length,damages:damages.length,journals:journals.length},findings,summary:{critical:findings.filter(x=>x.severity==="critical").length,warnings:findings.filter(x=>x.severity==="warning").length},readOnly:true},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
