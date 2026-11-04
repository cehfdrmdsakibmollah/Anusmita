import {z} from "zod";
/** Explicit SKU-level volume offers; never infer discounts from quantity alone. */
export const quantityDiscountTierSchema=z.object({
 minQty:z.number().int().min(2).max(20),
 percent:z.number().int().min(1).max(50)
}).strict();
export const quantityDiscountsSchema=z.array(quantityDiscountTierSchema).max(10)
 .refine(tiers=>new Set(tiers.map(t=>t.minQty)).size===tiers.length,"Duplicate quantity tier")
 .refine(tiers=>tiers.every((tier,i)=>i===0||tier.minQty>tiers[i-1].minQty),"Quantity tiers must be sorted")
 .refine(tiers=>tiers.every((tier,i)=>i===0||tier.percent>=tiers[i-1].percent),"Higher quantities cannot receive a lower discount");
export type QuantityDiscountTier=z.infer<typeof quantityDiscountTierSchema>;
export function discountPercentForQty(tiers:ReadonlyArray<QuantityDiscountTier>,quantity:number){
 if(!Number.isSafeInteger(quantity)||quantity<1)return 0;
 return tiers.reduce((rate,tier)=>quantity>=tier.minQty?Math.max(rate,tier.percent):rate,0);
}
export function priceForQuantity(unitPricePaisa:number,quantity:number,tiers:ReadonlyArray<QuantityDiscountTier>){
 if(!Number.isSafeInteger(unitPricePaisa)||unitPricePaisa<0||!Number.isSafeInteger(quantity)||quantity<1||quantity>20)throw Error("Invalid price or quantity");
 const percent=discountPercentForQty(tiers,quantity);
 const undiscounted=unitPricePaisa*quantity;
 // Round the complete line once so the product total equals the amount charged.
 const totalPaisa=Math.round(undiscounted*(100-percent)/100);
 if(!Number.isSafeInteger(totalPaisa))throw Error("Invalid discounted total");
 return {quantity,percent,undiscountedPaisa:undiscounted,totalPaisa,savingsPaisa:undiscounted-totalPaisa};
}
