
import {z} from "zod";
const objectId=z.string().regex(/^[a-f0-9]{24}$/i);
export const supplierPaymentSchema=z.object({
 paymentKey:z.uuid(),
 method:z.enum(["bank_transfer","bkash_manual","nagad_manual","cash","other"]),
 reference:z.string().trim().min(5).max(100).regex(/^[^\x00-\x1F\x7F]+$/),
 amountPaisa:z.number().int().min(1).max(1_000_000_000_000),
 note:z.string().trim().min(8).max(500),
 verificationConfirmed:z.literal(true)
}).strict();
export function paymentReferenceKey(reference:string){
 const key=reference.trim().replace(/\s+/g," ").toUpperCase();
 if(key.length<5||key.length>100||/[\x00-\x1F\x7F]/.test(key))
  throw new Error("Invalid payment reference");
 return key;
}
export function remainingSupplierBalance(total:number,paid:number,attempt=0){
 for(const value of [total,paid,attempt]){
  if(!Number.isSafeInteger(value)||value<0||value>1_000_000_000_000)
   throw new Error("Invalid supplier balance amount");
 }
 if(paid>total)throw new Error("Supplier payment exceeds planned purchase");
 const remaining=total-paid;
 if(attempt>remaining)throw new Error("Payment exceeds outstanding supplier balance");
 return remaining-attempt;
}
