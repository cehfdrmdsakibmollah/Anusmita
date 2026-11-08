/** A balanced, immutable POS subledger entry. All amounts are integer paisa. */
export type PosPostingLine={account:string;debitPaisa:number;creditPaisa:number};
export function balancedPosJournal(lines:PosPostingLine[]){
 if(lines.length<2||lines.some(l=>!l.account.startsWith("pos:")||!Number.isSafeInteger(l.debitPaisa)||!Number.isSafeInteger(l.creditPaisa)||
  l.debitPaisa<0||l.creditPaisa<0||(l.debitPaisa>0&&l.creditPaisa>0)))throw new Error("Invalid POS posting");
 const debit=lines.reduce((sum,l)=>sum+l.debitPaisa,0),credit=lines.reduce((sum,l)=>sum+l.creditPaisa,0);
 if(!Number.isSafeInteger(debit)||debit<=0||debit!==credit)throw new Error("Unbalanced POS ledger entry");
 return {lines,totalPaisa:debit};
}
export function posCashSalePosting(paidPaisa:number,costPaisa:number|null){
 const lines:PosPostingLine[]=[
  {account:"pos:cash_on_hand",debitPaisa:paidPaisa,creditPaisa:0},
  {account:"pos:cash_sales",debitPaisa:0,creditPaisa:paidPaisa}
 ];
 if(costPaisa!==null&&costPaisa>0){
  lines.push({account:"pos:cogs",debitPaisa:costPaisa,creditPaisa:0});
  lines.push({account:"pos:inventory_asset",debitPaisa:0,creditPaisa:costPaisa});
 }
 return balancedPosJournal(lines);
}
export function posCashRefundPosting(amount:number){
 return balancedPosJournal([
  {account:"pos:sales_returns",debitPaisa:amount,creditPaisa:0},
  {account:"pos:cash_on_hand",debitPaisa:0,creditPaisa:amount}
 ]);
}
export function posInventoryDispositionPosting(kind:"restock"|"damage",cost:number){
 if(kind==="restock")return balancedPosJournal([
  {account:"pos:inventory_asset",debitPaisa:cost,creditPaisa:0},
  {account:"pos:cogs",debitPaisa:0,creditPaisa:cost}
 ]);
 return balancedPosJournal([
  {account:"pos:inventory_loss",debitPaisa:cost,creditPaisa:0},
  {account:"pos:inventory_asset",debitPaisa:0,creditPaisa:cost}
 ]);
}
