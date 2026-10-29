/** Bangladesh uses UTC+06 year-round. Keep reporting boundaries independent of server time. */
const DAY = 86_400_000;
const OFFSET = 6 * 60 * 60 * 1000;
export type DailyPoint = {date:string; orderedPaisa:number; collectedPaisa:number};
export type DashboardMetrics = {
 todayOrders:number; awaitingConfirmation:number; unpaidTransferOrders:number;
 availableUnits:number; reservedUnits:number; incomingUnits:number; lowStockSkus:number;
 supplierInvoicesOutstanding:number; netCollectionsPaisa:number;
 series:DailyPoint[]; generatedAt:string;
};
export function dashboardWindow(now:Date, days:7|14) {
 const local = new Date(now.getTime()+OFFSET);
 const today = new Date(Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate())-OFFSET);
 return {today,start:new Date(today.getTime()-(days-1)*DAY),end:now};
}
export function fillDailySeries(start:Date, days:7|14, sales:{_id:string;total:number}[], collections:{_id:string;total:number}[]):DailyPoint[] {
 const ordered = new Map(sales.map(x=>[x._id,x.total]));
 const collected = new Map(collections.map(x=>[x._id,x.total]));
 return Array.from({length:days},(_,i)=>{
  const date=new Date(start.getTime()+i*DAY+OFFSET).toISOString().slice(0,10);
  return {date,orderedPaisa:ordered.get(date)??0,collectedPaisa:collected.get(date)??0};
 });
}
/** Include negative refund days and a nonzero scale when all values are zero. */
export function chartGeometry(series:DailyPoint[]) {
 const amounts=series.flatMap(x=>[x.orderedPaisa,x.collectedPaisa]);
 const min=Math.min(0,...amounts), max=Math.max(100,...amounts);
 const y=(amount:number)=>151-(amount-min)/(max-min)*136;
 const x=(i:number)=>48+i*540/Math.max(1,series.length-1);
 return {min,max,x,y};
}
