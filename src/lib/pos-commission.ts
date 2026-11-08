import {z} from "zod";
export const commissionPolicyInput=z.object({
 branchId:z.string().regex(/^[a-f0-9]{24}$/i),
 cashierId:z.string().regex(/^[a-f0-9]{24}$/i),
 rateBps:z.number().int().min(0).max(2000),
 active:z.boolean(),
 reason:z.string().trim().min(8).max(300)
}).strict();
/** Basis points: 100 = 1%, with rounding to nearest paisa. */
export function commissionAccrual(paidPaisa:number,rateBps:number){
 if(!Number.isSafeInteger(paidPaisa)||paidPaisa<0||!Number.isSafeInteger(rateBps)||rateBps<0||rateBps>2000)throw Error("Invalid commission basis");
 const amount=Math.round(paidPaisa*rateBps/10000);
 if(!Number.isSafeInteger(amount))throw Error("Commission exceeds safe limit");
 return amount;
}
/** Refund commissions are reversed proportionally to refunded cash, never re-accrued. */
export function netSaleCommission(originalCommissionPaisa:number|null,originalPaidPaisa:number,refundedPaisa:number):number|null{
 if(originalCommissionPaisa===null)return null;
 if(![originalCommissionPaisa,originalPaidPaisa,refundedPaisa].every(x=>Number.isSafeInteger(x)&&x>=0)||originalPaidPaisa<=0||refundedPaisa>originalPaidPaisa)throw Error("Invalid commission reversal");
 return originalCommissionPaisa-Math.round(originalCommissionPaisa*refundedPaisa/originalPaidPaisa);
}
