
import {describe,it,expect} from "vitest";
import {canvaSource,canvaReviewCsv} from "./canva-source";
import {parseCells} from "./catalog-csv";
describe("Canva ANUSMITA source review",()=>{
 it("extracts 30 unique names across original pages without fabricated stock, price or SKU",()=>{
  expect(canvaSource.products).toHaveLength(30);
  expect(new Set(canvaSource.products.map(x=>x.sourceName.toLowerCase())).size).toBe(30);
  expect(canvaSource.products.every(x=>x.sourcePage>=2&&x.sourcePage<=6)).toBe(true);
  expect(canvaSource.products.filter(x=>x.sourcePage===4)).toHaveLength(6);
  expect(canvaSource.products.some(x=>x.sourceName.includes("COSRX"))).toBe(true);
  expect(canvaSource.products.every(x=>!Object.keys(x).some(k=>/price|stock|sku|cost/i.test(k)))).toBe(true);
 });
 it("exports reviewer CSV with blank SKU, amounts and stock, never import-ready records",()=>{
  const csv=canvaReviewCsv(),cells=parseCells(csv);
  expect(cells).toHaveLength(31);
  const headers=cells[0];
  for(const key of ["matched_sku","verified_price_bdt","verified_cost_bdt","verified_opening_stock"]){
   const n=headers.indexOf(key);expect(n).toBeGreaterThan(-1);
   expect(cells.slice(1).every(row=>row[n]==="")).toBe(true);
  }
  expect(cells[1][0]).toBe("2");
 });
});
