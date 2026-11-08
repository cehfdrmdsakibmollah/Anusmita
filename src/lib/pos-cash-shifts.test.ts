import {describe,it,expect} from "vitest";
import {openCashShiftInput,closeCashShiftInput,reconcileCashShift} from "./pos-cash-shifts";
describe("POS cashier shift reconciliation",()=>{
 it("calculates real drawer expectations with exact integer paisa",()=>{
  expect(reconcileCashShift(50000,241050,291000)).toEqual({
   expectedCashPaisa:291050,closingCountPaisa:291000,variancePaisa:-50
  });
  expect(reconcileCashShift(0,0,0).variancePaisa).toBe(0);
  expect(reconcileCashShift(10000,30000,45000).variancePaisa).toBe(5000);
 });
 it("subtracts approved cash refunds from the drawer and rejects over-refunding cash",()=>{
  expect(reconcileCashShift(50000,200000,190000,60000)).toEqual({expectedCashPaisa:190000,closingCountPaisa:190000,variancePaisa:0});
  expect(()=>reconcileCashShift(0,50000,0,50001)).toThrow();
 });
  it("rejects invalid or non-integer cash and overflow",()=>{
  expect(()=>reconcileCashShift(-1,0,0)).toThrow();
  expect(()=>reconcileCashShift(1.25,0,0)).toThrow();
  expect(()=>reconcileCashShift(Number.MAX_SAFE_INTEGER,1,0)).toThrow();
  expect(()=>reconcileCashShift(1,0,NaN)).toThrow();
 });
 it("requires a valid branch and nonnegative opening cash",()=>{
  const ok={branchId:"aaaaaaaaaaaaaaaaaaaaaaaa",openingFloatPaisa:12500};
  expect(openCashShiftInput.safeParse(ok).success).toBe(true);
  expect(openCashShiftInput.safeParse({...ok,openingFloatPaisa:-1}).success).toBe(false);
  expect(openCashShiftInput.safeParse({...ok,branchId:"../admin"}).success).toBe(false);
  expect(openCashShiftInput.safeParse({...ok,operatorId:"spoof"}).success).toBe(false);
 });
 it("rejects forged close actor or invalid drawer amount",()=>{
  const ok={shiftId:"bbbbbbbbbbbbbbbbbbbbbbbb",closingCountPaisa:19000,closingNote:"Drawer physically counted"};
  expect(closeCashShiftInput.safeParse(ok).success).toBe(true);
  expect(closeCashShiftInput.safeParse({...ok,closingCountPaisa:12.34}).success).toBe(false);
  expect(closeCashShiftInput.safeParse({...ok,closedBy:"admin"}).success).toBe(false);
 });
});
