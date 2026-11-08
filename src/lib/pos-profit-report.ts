export type CostLine={quantity:number;unitCostPaisa:number|null|undefined};
export function knownLineCost(lines:readonly CostLine[]):{costPaisa:number;complete:boolean}{
 let costPaisa=0;
 for(const line of lines){
  if(!Number.isSafeInteger(line.quantity)||line.quantity<1||!Number.isSafeInteger(line.unitCostPaisa)||Number(line.unitCostPaisa)<0)return {costPaisa,complete:false};
  costPaisa+=line.quantity*Number(line.unitCostPaisa);
  if(!Number.isSafeInteger(costPaisa))return {costPaisa:0,complete:false};
 }
 return {costPaisa,complete:true};
}
export function posPeriodMargin(args:{salesPaisa:number;refundsPaisa:number;costOfGoodsPaisa:number;restockedCostPaisa:number;damageCostPaisa:number;costComplete:boolean}){
 const {salesPaisa,refundsPaisa,costOfGoodsPaisa,restockedCostPaisa,damageCostPaisa,costComplete}=args;
 const netRevenuePaisa=salesPaisa-refundsPaisa;
 // Damaged/unsellable returned goods are not added back to inventory.
 const netCostPaisa=costOfGoodsPaisa-restockedCostPaisa+damageCostPaisa;
 return {netRevenuePaisa,netCostPaisa,
  grossContributionPaisa:costComplete?netRevenuePaisa-netCostPaisa:null,
  marginPercent:costComplete&&netRevenuePaisa>0?Math.round((netRevenuePaisa-netCostPaisa)/netRevenuePaisa*10000)/100:null};
}
