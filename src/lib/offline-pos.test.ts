import {describe,it,expect} from "vitest";
import {posSaleInput,calculatePosCash,assertUniquePosLines,bdBusinessDate,assertPosPriceSnapshot} from "./offline-pos";
const line=(quantity:number,unitPricePaisa:number)=>({quantity,unitPricePaisa});
describe("real POS billing contract",()=>{
 it("calculates exact integer cash totals and change, not floats",()=>{
  expect(calculatePosCash([line(2,145000),line(1,169000)],10000,500000)).toEqual({subtotalPaisa:459000,discountPaisa:10000,totalPaisa:449000,tenderedPaisa:500000,changePaisa:51000});
 });
 it("rejects insufficient cash, invalid discounts and invalid prices",()=>{
  expect(()=>calculatePosCash([line(1,145000)],0,140000)).toThrow("less than total");
  expect(()=>calculatePosCash([line(1,145000)],145000,145000)).toThrow("Invalid discount");
  expect(()=>calculatePosCash([line(1,0)],0,0)).toThrow();
  expect(()=>calculatePosCash([line(2,145000)],-1,290000)).toThrow();
 });
 it("rejects duplicate product IDs and invalid quantities",()=>{
  expect(()=>assertUniquePosLines([{productId:"same"},{productId:"same"}])).toThrow();
  expect(()=>assertUniquePosLines([{productId:"a"},{productId:"b"}])).not.toThrow();
  const request={operationKey:"11111111-1111-4111-8111-111111111111",branchId:"aaaaaaaaaaaaaaaaaaaaaaaa",lines:[{productId:"bbbbbbbbbbbbbbbbbbbbbbbb",quantity:2,expectedUnitPricePaisa:145000}],paymentMethod:"cash",discountPaisa:0,tenderedPaisa:300000};
  expect(posSaleInput.safeParse(request).success).toBe(true);
  expect(posSaleInput.safeParse({...request,lines:[{productId:"bbbbbbbbbbbbbbbbbbbbbbbb",quantity:0,expectedUnitPricePaisa:145000}]}).success).toBe(false);
  expect(posSaleInput.safeParse({...request,paymentMethod:"card"}).success).toBe(false);
  expect(posSaleInput.safeParse({...request,stockAdjustment:1000}).success).toBe(false);
 });
 it("rejects stale displayed prices instead of charging unexpected server totals",()=>{
  expect(()=>assertPosPriceSnapshot(145000,145000)).not.toThrow();
  expect(()=>assertPosPriceSnapshot(145100,145000)).toThrow("price changed");
  expect(()=>assertPosPriceSnapshot(0,100)).toThrow();
  const request={operationKey:"11111111-1111-4111-8111-111111111111",branchId:"aaaaaaaaaaaaaaaaaaaaaaaa",lines:[{productId:"bbbbbbbbbbbbbbbbbbbbbbbb",quantity:1}],paymentMethod:"cash",discountPaisa:0,tenderedPaisa:145000};
  expect(posSaleInput.safeParse(request).success).toBe(false);
 });
  it("accepts only a valid original refund ObjectId for a linked replacement sale",()=>{
  const basic={operationKey:"11111111-1111-4111-8111-111111111111",branchId:"aaaaaaaaaaaaaaaaaaaaaaaa",
   lines:[{productId:"bbbbbbbbbbbbbbbbbbbbbbbb",quantity:1,expectedUnitPricePaisa:12500}],paymentMethod:"cash",discountPaisa:0,tenderedPaisa:12500};
  expect(posSaleInput.safeParse({...basic,exchangeReturnId:"cccccccccccccccccccccccc"}).success).toBe(true);
  expect(posSaleInput.safeParse({...basic,exchangeReturnId:"../somewhere"}).success).toBe(false);
  expect(posSaleInput.safeParse({...basic,exchangeRefundPaisa:500000}).success).toBe(false);
 });
  it("books in Bangladesh local business date",()=>{
  expect(bdBusinessDate(new Date("2026-11-07T20:30:00Z"))).toBe("2026-11-08");
 });
});
