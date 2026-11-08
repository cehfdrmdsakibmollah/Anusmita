import {describe,it,expect} from "vitest";
import {knownLineCost,posPeriodMargin} from "./pos-profit-report";
describe("POS period contribution reporting",()=>{
 it("calculates known original purchase costs exactly from immutable line snapshots",()=>{
  expect(knownLineCost([{quantity:2,unitCostPaisa:12000},{quantity:3,unitCostPaisa:5500}])).toEqual({costPaisa:40500,complete:true});
  expect(knownLineCost([{quantity:1,unitCostPaisa:0}])).toEqual({costPaisa:0,complete:true});
 });
 it("does not invent a historic COGS amount for missing snapshots",()=>{
  expect(knownLineCost([{quantity:1,unitCostPaisa:null}]).complete).toBe(false);
  expect(knownLineCost([{quantity:1,unitCostPaisa:undefined}]).complete).toBe(false);
  expect(knownLineCost([{quantity:1,unitCostPaisa:-1}]).complete).toBe(false);
 });
 it("subtracts refunds and damaged inventory, reverses only inspected restock costs",()=>{
  expect(posPeriodMargin({salesPaisa:200000,refundsPaisa:40000,costOfGoodsPaisa:80000,restockedCostPaisa:12000,damageCostPaisa:5000,costComplete:true}))
   .toEqual({netRevenuePaisa:160000,netCostPaisa:73000,grossContributionPaisa:87000,marginPercent:54.38});
 });
 it("returns unknown contribution rather than fake profitability when cost data incomplete",()=>{
  const r=posPeriodMargin({salesPaisa:20000,refundsPaisa:0,costOfGoodsPaisa:0,restockedCostPaisa:0,damageCostPaisa:0,costComplete:false});
  expect(r.grossContributionPaisa).toBeNull();
  expect(r.marginPercent).toBeNull();
 });
});
