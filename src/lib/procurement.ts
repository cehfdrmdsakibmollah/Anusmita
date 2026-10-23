
import {z} from "zod";

export const objectId=z.string().regex(/^[a-f0-9]{24}$/i);
const units=z.number().int().min(1).max(100000);
export const createPurchaseSchema=z.object({
 supplierId:objectId,
 note:z.string().trim().max(600).default(""),
 items:z.array(z.object({
  productId:objectId,
  quantity:units,
  unitCostPaisa:z.number().int().min(0).max(1_000_000_000)
 }).strict()).min(1).max(30)
}).strict().superRefine((data,ctx)=>{
 if(new Set(data.items.map(x=>x.productId.toLowerCase())).size!==data.items.length)
  ctx.addIssue({code:"custom",path:["items"],message:"Repeated product SKU in purchase order"});
});
export const receiptSchema=z.object({
 receiptKey:z.uuid(),
 note:z.string().trim().min(5).max(500),
 lines:z.array(z.object({productId:objectId,quantity:units}).strict()).min(1).max(30)
}).strict().superRefine((data,ctx)=>{
 if(new Set(data.lines.map(x=>x.productId.toLowerCase())).size!==data.lines.length)
  ctx.addIssue({code:"custom",path:["lines"],message:"Repeated product in goods receipt"});
});

export type PurchaseItem={productId:string;quantity:number;received:number;unitCostPaisa:number};
export type ReceiptLine={productId:string;quantity:number};

export function purchaseValue(items:Pick<PurchaseItem,"quantity"|"unitCostPaisa">[]){
 const amount=items.reduce((sum,i)=>{
  if(!Number.isSafeInteger(i.quantity)||i.quantity<1||!Number.isSafeInteger(i.unitCostPaisa)||i.unitCostPaisa<0)
   throw new Error("Invalid purchase quantity or cost");
  return sum+i.quantity*i.unitCostPaisa;
 },0);
 if(!Number.isSafeInteger(amount)||amount>1_000_000_000_000)throw new Error("Purchase value exceeds allowed limit");
 return amount;
}

export function receivePlan(items:PurchaseItem[],lines:ReceiptLine[]){
 const update=items.map(item=>({...item,productId:item.productId.toLowerCase()}));
 const index=new Map(update.map((it,i)=>[it.productId,i]));
 if(index.size!==update.length)throw new Error("Purchase contains duplicate products");
 if(!lines.length)throw new Error("At least one receipt line is needed");
 const seen=new Set<string>();
 for(const line of lines){
  const id=line.productId.toLowerCase();
  if(seen.has(id))throw new Error("Duplicate goods-receipt line");
  seen.add(id);
  const n=index.get(id);
  if(n===undefined)throw new Error("Product is not on this purchase order");
  const previous=update[n];
  if(!Number.isSafeInteger(line.quantity)||line.quantity<=0||!Number.isSafeInteger(previous.received)||previous.received<0||
    previous.received>previous.quantity||line.quantity>previous.quantity-previous.received)
    throw new Error("Receipt exceeds outstanding purchase quantity");
  update[n]={...previous,received:previous.received+line.quantity};
 }
 return {
  items:update,
  status:update.every(x=>x.received===x.quantity)?"received" as const:"partially_received" as const,
  receivedUnits:lines.reduce((n,x)=>n+x.quantity,0)
 };
}
