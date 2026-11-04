import {describe,it,expect} from "vitest";
import {productSchema} from "@/lib/validation";
const base={name:"Test product",slug:"test-product",sku:"TEST-001",category:"Skincare",pricePaisa:10000,costPaisa:5000};
describe("Product subcategory persistence schema",()=>{
 it("preserves compatibility with existing products without subcategory",()=>{
  const result=productSchema.parse(base);
  expect(result.subcategoryId).toBe(null);
 });
 it("accepts a valid saved registry subcategory ID",()=>{
  const id="507f1f77bcf86cd799439011";
  expect(productSchema.parse({...base,subcategoryId:id}).subcategoryId).toBe(id);
 });
 it("rejects a legacy category name used as subcategory ID",()=>{
  expect(productSchema.safeParse({...base,subcategoryId:"Skincare"}).success).toBe(false);
 });
});
