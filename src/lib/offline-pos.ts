import {z} from "zod";
export const posId=z.string().regex(/^[0-9a-f]{24}$/i);
export const posSaleInput=z.object({
 operationKey:z.string().uuid(),
 branchId:posId,
 exchangeReturnId:posId.optional(),
 lines:z.array(z.object({productId:posId,quantity:z.number().int().min(1).max(100),expectedUnitPricePaisa:z.number().int().positive().max(1000000000)}).strict()).min(1).max(40),
 customerName:z.string().trim().max(100).default(""),
 customerPhone:z.string().trim().regex(/^(|01[0-9]{9})$/).default(""),
 paymentMethod:z.literal("cash"),
 discountPaisa:z.number().int().min(0).max(10000000).default(0),
 tenderedPaisa:z.number().int().min(0).max(1000000000)
}).strict();
export type PosSaleInput=z.infer<typeof posSaleInput>;
export function bdBusinessDate(input:Date):string{
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Dhaka",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(input);
 const get=(type:string)=>parts.find(p=>p.type===type)?.value||"";
 return get("year")+"-"+get("month")+"-"+get("day");
}
export function calculatePosCash(lines:readonly {quantity:number;unitPricePaisa:number}[],discountPaisa:number,tenderedPaisa:number){
 if(!lines.length||!Number.isSafeInteger(discountPaisa)||discountPaisa<0||!Number.isSafeInteger(tenderedPaisa))throw Error("Invalid payment");
 let subtotalPaisa=0;
 for(const line of lines){
  if(!Number.isSafeInteger(line.unitPricePaisa)||line.unitPricePaisa<=0||!Number.isSafeInteger(line.quantity)||line.quantity<1)throw Error("Invalid product price or quantity");
  subtotalPaisa+=line.unitPricePaisa*line.quantity;
  if(!Number.isSafeInteger(subtotalPaisa))throw Error("Sale amount exceeds safe limit");
 }
 if(discountPaisa>subtotalPaisa||subtotalPaisa-discountPaisa<1)throw Error("Invalid discount");
 const totalPaisa=subtotalPaisa-discountPaisa;
 if(tenderedPaisa<totalPaisa)throw Error("Cash tendered is less than total");
 return {subtotalPaisa,discountPaisa,totalPaisa,tenderedPaisa,changePaisa:tenderedPaisa-totalPaisa};
}
export function assertUniquePosLines(lines:readonly {productId:string}[]){
 if(new Set(lines.map(x=>x.productId)).size!==lines.length)throw Error("Duplicate products in a single POS sale");
}

/** Never charge against a stale displayed price after offline draft restoration. */
export function assertPosPriceSnapshot(current:number,expected:number){
 if(!Number.isSafeInteger(current)||current<=0||!Number.isSafeInteger(expected)||expected<=0)
  throw new Error("Invalid current or displayed price");
 if(current!==expected)throw new Error("Product price changed. Refresh the catalog and review the cart before sale.");
}
