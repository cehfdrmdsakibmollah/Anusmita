import {z} from "zod";
const id=z.string().regex(/^[a-f0-9]{24}$/i);
export const posReturnInput=z.object({
 operationKey:z.string().uuid(),saleId:id,
 lines:z.array(z.object({productId:id,quantity:z.number().int().min(1).max(100)}).strict()).min(1).max(40),
 reason:z.string().trim().min(8).max(500),
 disposition:z.enum(["quarantine","damaged"]),
 cashHandedToCustomer:z.literal(true)
}).strict();
export function cashRefundForReturn(subtotalPaisa:number,totalPaidPaisa:number,alreadyReturnedGrossPaisa:number,newGrossPaisa:number){
 for(const n of [subtotalPaisa,totalPaidPaisa,alreadyReturnedGrossPaisa,newGrossPaisa])
  if(!Number.isSafeInteger(n)||n<0)throw new Error("Invalid return amounts");
 if(subtotalPaisa<=0||totalPaidPaisa<=0||totalPaidPaisa>subtotalPaisa||newGrossPaisa<=0||
  alreadyReturnedGrossPaisa+newGrossPaisa>subtotalPaisa)throw new Error("Return exceeds the original sale");
 // Exact proportional discount allocation, including last partial return.
 const a=BigInt(alreadyReturnedGrossPaisa),b=BigInt(newGrossPaisa),paid=BigInt(totalPaidPaisa),sub=BigInt(subtotalPaisa);
 const refund=Number(((a+b)*paid)/sub-(a*paid)/sub);
 if(!Number.isSafeInteger(refund)||refund<=0)throw new Error("Refund amount must be positive");
 return refund;
}
export function remainingReturnQuantity(sold:number,returned:number){
 if(!Number.isInteger(sold)||!Number.isInteger(returned)||sold<0||returned<0||returned>sold)throw new Error("Invalid return quantities");
 return sold-returned;
}
