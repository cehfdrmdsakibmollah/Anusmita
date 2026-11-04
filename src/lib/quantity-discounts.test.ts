import {describe,it,expect} from "vitest";
import {quantityDiscountsSchema,priceForQuantity,discountPercentForQty} from "./quantity-discounts";
import {productSchema} from "./validation";
import {cartTotals} from "./money";
const tiers=[{minQty:2 as const,percent:5},{minQty:3 as const,percent:8},{minQty:5 as const,percent:12}];
describe("SKU quantity discount price safety",()=>{
 it("does not apply discounts unless configured",()=>expect(priceForQuantity(220000,5,[]).totalPaisa).toBe(1100000));
 it("applies best matching tier and preserves correct line totals",()=>{
  expect(priceForQuantity(220000,1,tiers).totalPaisa).toBe(220000);
  expect(priceForQuantity(220000,2,tiers)).toMatchObject({percent:5,totalPaisa:418000,savingsPaisa:22000});
  expect(priceForQuantity(220000,3,tiers)).toMatchObject({percent:8,totalPaisa:607200});
  expect(priceForQuantity(220000,5,tiers)).toMatchObject({percent:12,totalPaisa:968000});
  expect(discountPercentForQty(tiers,20)).toBe(12);
 });
 it("rejects inconsistent tiers or duplicate quantities",()=>{
  expect(quantityDiscountsSchema.safeParse([{minQty:2,percent:15},{minQty:3,percent:5}]).success).toBe(false);
  expect(quantityDiscountsSchema.safeParse([{minQty:2,percent:5},{minQty:2,percent:10}]).success).toBe(false);
 });
 it("keeps legacy products with no offers valid",()=>{
  const basic={name:"Baby Cream",slug:"baby-cream",sku:"BABY-001",category:"Skincare",pricePaisa:220000,costPaisa:150000};
  expect(productSchema.parse(basic).quantityDiscounts).toEqual([]);
 });
 it("uses discounted line totals for server order accounting",()=>{
  expect(cartTotals([{quantity:3,unitPricePaisa:220000,lineTotalPaisa:607200}],12000))
   .toEqual({subtotalPaisa:607200,shippingPaisa:12000,totalPaisa:619200});
 });
});
