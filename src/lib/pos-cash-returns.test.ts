import {describe,it,expect} from "vitest";
import {cashRefundForReturn,remainingReturnQuantity,posReturnInput} from "./pos-cash-returns";
describe("POS invoice cash refund safety",()=>{
 it("prorates an original sale discount across partial and final returns without overpayment",()=>{
  // Original sale: gross ৳100, paid ৳90 after ৳10 discount
  expect(cashRefundForReturn(10000,9000,0,3000)).toBe(2700);
  expect(cashRefundForReturn(10000,9000,3000,7000)).toBe(6300);
  expect(cashRefundForReturn(10000,9000,0,10000)).toBe(9000);
  expect(cashRefundForReturn(10000,9000,0,3000)+cashRefundForReturn(10000,9000,3000,7000)).toBe(9000);
 });
 it("distributes integer paisa rounding correctly over many partial returns",()=>{
  const first=cashRefundForReturn(100,99,0,33);
  const second=cashRefundForReturn(100,99,33,33);
  const last=cashRefundForReturn(100,99,66,34);
  expect(first+second+last).toBe(99);
 });
 it("rejects attempts to refund more than original quantity or paid amount",()=>{
  expect(()=>cashRefundForReturn(1000,1001,0,500)).toThrow();
  expect(()=>cashRefundForReturn(1000,900,900,101)).toThrow();
  expect(()=>cashRefundForReturn(1000,900,0,0)).toThrow();
  expect(remainingReturnQuantity(3,2)).toBe(1);
  expect(()=>remainingReturnQuantity(3,4)).toThrow();
 });
 it("requires manager acknowledgment, product IDs, reason and quarantine disposition",()=>{
  const request={operationKey:"11111111-1111-4111-8111-111111111111",saleId:"aaaaaaaaaaaaaaaaaaaaaaaa",
   lines:[{productId:"bbbbbbbbbbbbbbbbbbbbbbbb",quantity:1}],reason:"Returned unopened package",disposition:"quarantine",cashHandedToCustomer:true};
  expect(posReturnInput.safeParse(request).success).toBe(true);
  expect(posReturnInput.safeParse({...request,cashHandedToCustomer:false}).success).toBe(false);
  expect(posReturnInput.safeParse({...request,reason:"bad"}).success).toBe(false);
  expect(posReturnInput.safeParse({...request,refundPaisa:1000000}).success).toBe(false);
 });
});
