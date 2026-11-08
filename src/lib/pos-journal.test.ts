import {describe,it,expect} from "vitest";
import {balancedPosJournal,posCashSalePosting,posCashRefundPosting,posInventoryDispositionPosting} from "./pos-journal";
describe("double-entry POS accounting",()=>{
 it("balances cash sale and its actual cost basis",()=>{
  const journal=posCashSalePosting(145000,85000);
  expect(journal.totalPaisa).toBe(230000);
  expect(journal.lines.map(l=>l.account)).toEqual(["pos:cash_on_hand","pos:cash_sales","pos:cogs","pos:inventory_asset"]);
  expect(journal.lines.reduce((n,l)=>n+l.debitPaisa,0)).toBe(journal.lines.reduce((n,l)=>n+l.creditPaisa,0));
 });
 it("posts cash sales without fake cost amounts for unknown legacy costs",()=>{
  const journal=posCashSalePosting(50000,null);
  expect(journal.lines).toHaveLength(2);
  expect(journal.totalPaisa).toBe(50000);
 });
 it("posts manager cash refunds with matching debit and credit",()=>{
  expect(posCashRefundPosting(12500).lines).toEqual([
   {account:"pos:sales_returns",debitPaisa:12500,creditPaisa:0},
   {account:"pos:cash_on_hand",debitPaisa:0,creditPaisa:12500}
  ]);
 });
 it("credits original COGS for actual inspected restock and debits damage loss",()=>{
  expect(posInventoryDispositionPosting("restock",22000).lines[0].account).toBe("pos:inventory_asset");
  expect(posInventoryDispositionPosting("damage",22000).lines[0].account).toBe("pos:inventory_loss");
 });
 it("rejects unbalanced, zero, negative or non-POS postings",()=>{
  expect(()=>balancedPosJournal([{account:"pos:cash",debitPaisa:100,creditPaisa:0},{account:"pos:sales",debitPaisa:0,creditPaisa:90}])).toThrow();
  expect(()=>balancedPosJournal([{account:"external",debitPaisa:100,creditPaisa:0},{account:"pos:sales",debitPaisa:0,creditPaisa:100}])).toThrow();
  expect(()=>posCashRefundPosting(0)).toThrow();
  expect(()=>posCashSalePosting(-1,0)).toThrow();
 });
});
