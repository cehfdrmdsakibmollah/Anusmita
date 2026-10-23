
import {describe,it,expect} from "vitest";
import {paymentReferenceKey,remainingSupplierBalance,supplierPaymentSchema} from "./supplier-payments";
const valid={paymentKey:"0bb1e75e-1b47-4df5-b83b-365be1bb2135",method:"bank_transfer",
 reference:" TXN-2046-99333 ",amountPaisa:12000,note:"Verified in banking statement",verificationConfirmed:true};
describe("supplier payment verification",()=>{
 it("requires independent confirmation and a unique UUID",()=>{
  expect(supplierPaymentSchema.safeParse(valid).success).toBe(true);
  expect(supplierPaymentSchema.safeParse({...valid,verificationConfirmed:false}).success).toBe(false);
  expect(supplierPaymentSchema.safeParse({...valid,paymentKey:"repeat",amountPaisa:0}).success).toBe(false);
 });
 it("normalizes payment references to detect duplicates",()=>{
  expect(paymentReferenceKey("  abc-99  22  ")).toBe("ABC-99 22");
  expect(paymentReferenceKey(" a ")).toThrow();
  expect(paymentReferenceKey("bad\nreference")).toThrow();
 });
 it("prevents overpayment including concurrent amount checks",()=>{
  expect(remainingSupplierBalance(50000,20000,10000)).toBe(20000);
  expect(remainingSupplierBalance(50000,20000,30001)).toThrow(/exceeds/);
  expect(remainingSupplierBalance(50000,50001)).toThrow(/exceeds/);
  expect(remainingSupplierBalance(100,Number.MAX_SAFE_INTEGER)).toThrow();
 });
});
