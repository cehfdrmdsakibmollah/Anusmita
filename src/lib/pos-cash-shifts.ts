import {z} from "zod";
export const shiftMoney=z.number().int().min(0).max(1000000000);
export const openCashShiftInput=z.object({branchId:z.string().regex(/^[a-f0-9]{24}$/i),openingFloatPaisa:shiftMoney}).strict();
export const closeCashShiftInput=z.object({
 shiftId:z.string().regex(/^[a-f0-9]{24}$/i),
 closingCountPaisa:shiftMoney,
 closingNote:z.string().trim().max(500).default("")
}).strict();
export function reconcileCashShift(openingFloatPaisa:number,cashSalesPaisa:number,closingCountPaisa:number,cashRefundsPaisa=0){
 if(![openingFloatPaisa,cashSalesPaisa,closingCountPaisa,cashRefundsPaisa].every(v=>Number.isSafeInteger(v)&&v>=0))throw Error("Invalid cash reconciliation");
 const expectedCashPaisa=openingFloatPaisa+cashSalesPaisa-cashRefundsPaisa;
 if(!Number.isSafeInteger(expectedCashPaisa)||expectedCashPaisa<0)throw Error("Cash amount exceeds safe limit");
 return {expectedCashPaisa,closingCountPaisa,variancePaisa:closingCountPaisa-expectedCashPaisa};
}
