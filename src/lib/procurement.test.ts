
import {describe,it,expect} from "vitest";
import {createPurchaseSchema,receiptSchema,purchaseValue,receivePlan} from "./procurement";
const a="507f1f77bcf86cd799439011",b="507f1f77bcf86cd799439012";
const items=[{productId:a,quantity:10,received:0,unitCostPaisa:5000},{productId:b,quantity:5,received:0,unitCostPaisa:9000}];
describe("safe ANUSMITA procurement",()=>{
 it("computes integer paisa totals exactly",()=>{
  expect(purchaseValue(items)).toBe(95000);
  expect(()=>purchaseValue([{quantity:5,unitCostPaisa:Number.MAX_SAFE_INTEGER}])).toThrow();
 });
 it("allows incremental goods receipts and closes only after all units arrive",()=>{
  const first=receivePlan(items,[{productId:a,quantity:3}]);
  expect(first.status).toBe("partially_received");
  expect(first.items[0].received).toBe(3);
  const second=receivePlan(first.items,[{productId:a,quantity:7},{productId:b,quantity:5}]);
  expect(second.status).toBe("received");
  expect(second.items.map(i=>i.received)).toEqual([10,5]);
  expect(items[0].received).toBe(0);
 });
 it("rejects unknown/duplicate/over-received goods",()=>{
  expect(()=>receivePlan(items,[{productId:a,quantity:11}])).toThrow(/exceeds/);
  expect(()=>receivePlan(items,[{productId:"507f1f77bcf86cd799439013",quantity:1}])).toThrow(/not on/);
  expect(()=>receivePlan(items,[{productId:a,quantity:1},{productId:a,quantity:1}])).toThrow(/Duplicate/);
 });
 it("validates duplicate procurement items and idempotent UUID receipts",()=>{
  expect(createPurchaseSchema.safeParse({supplierId:a,items:[{productId:a,quantity:1,unitCostPaisa:0},{productId:a,quantity:1,unitCostPaisa:1}]}).success).toBe(false);
  expect(receiptSchema.safeParse({receiptKey:"abc",note:"received intact",lines:[{productId:a,quantity:1}]}).success).toBe(false);
 });
});
