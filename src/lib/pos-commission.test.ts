import {describe,it,expect} from "vitest";
import {commissionPolicyInput,commissionAccrual,netSaleCommission} from "./pos-commission";
describe("POS commission rules and refund reversals",()=>{
 it("calculates exact integer-paisa commission accrual",()=>{
  expect(commissionAccrual(125000,250)).toBe(3125);
  expect(commissionAccrual(1000,0)).toBe(0);
  expect(commissionAccrual(101,100)).toBe(1);
 });
 it("reduces commission after verified full and partial cash refunds",()=>{
  expect(netSaleCommission(1000,100000,20000)).toBe(800);
  expect(netSaleCommission(1000,100000,100000)).toBe(0);
  expect(netSaleCommission(null,100000,100000)).toBeNull();
 });
 it("rejects invalid rates, commission sums and excessive refunds",()=>{
  expect(()=>commissionAccrual(1000,2001)).toThrow();
  expect(()=>commissionAccrual(-1,100)).toThrow();
  expect(()=>netSaleCommission(100,1000,1001)).toThrow();
 });
 it("requires audited policy edits without staff/payroll spoofing",()=>{
  const input={branchId:"aaaaaaaaaaaaaaaaaaaaaaaa",cashierId:"bbbbbbbbbbbbbbbbbbbbbbbb",rateBps:150,active:true,reason:"Approved staff policy"};
  expect(commissionPolicyInput.safeParse(input).success).toBe(true);
  expect(commissionPolicyInput.safeParse({...input,rateBps:2001}).success).toBe(false);
  expect(commissionPolicyInput.safeParse({...input,payoutPaisa:100000}).success).toBe(false);
  expect(commissionPolicyInput.safeParse({...input,reason:"x"}).success).toBe(false);
 });
});
