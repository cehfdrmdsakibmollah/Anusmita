
import {describe,it,expect} from "vitest";
import {hrWholesalePublic,parseHrSupplierCsv,hrWholesaleSourceCsv,hrSupplierTemplate,isHrWebsite} from "./hr-supplier";
import {parseCells} from "./catalog-csv";
describe("HR Wholesale product-source review",()=>{
 it("stores 32 publicly observed candidates without pretending they have verified cost, stock or a supplier SKU",()=>{
  expect(hrWholesalePublic.candidateItems).toHaveLength(32);
  expect(new Set(hrWholesalePublic.candidateItems.map(x=>x.printedName.toLowerCase())).size).toBe(32);
  expect(hrWholesalePublic.candidateItems.every(x=>!x.priceVisible&&!x.stockVerified)).toBe(true);
  expect(hrWholesalePublic.candidateItems.some(x=>x.printedName.includes("COSRX"))).toBe(true);
 });
 it("exports candidate CSV with blank costs and supplier SKU fields",()=>{
  const csv=parseCells(hrWholesaleSourceCsv(),400,260000);
  expect(csv.length).toBe(33);
  expect(csv.slice(1).every(row=>row[6]===""&&row[7]===""&&row[8]==="")).toBe(true);
  expect(hrSupplierTemplate()).toContain("supplier_ref,product_name,brand");
 });
 it("parses supplier quote CSV and preserves blank prices",()=>{
  const csv="supplier_ref,product_name,brand,pack_size,product_url,quoted_cost_bdt\n1004,COSRX Snail 92 Cream,COSRX,100g,https://hrwholesalecosmetics.com/product/cosrx-advanced-snail-92-all-in-one-cream-100g-1004,520.50\n,Medicube Test Cream,Medicube,50ml,,\n";
  const rows=parseHrSupplierCsv(csv);
  expect(rows).toHaveLength(2);
  expect(rows[0].quotedCostPaisa).toBe(52050);
  expect(rows[1].quotedCostPaisa).toBeNull();
  expect(rows[1].sourceRef).toMatch(/^NAME-/);
 });
 it("accepts 250+ supplier rows without weakening the 100-row live product parser",()=>{
  const header="supplier_ref,product_name,brand,pack_size,product_url,quoted_cost_bdt\n";
  const rows=Array.from({length:270},(_,i)=>"HR-"+i+",Example Product "+i+",COSRX,50ml,,").join("\n");
  expect(parseHrSupplierCsv(header+rows)).toHaveLength(270);
  const tooMany=Array.from({length:401},(_,i)=>"HR-"+i+",Example Product "+i+",COSRX,50ml,,").join("\n");
  expect(()=>parseHrSupplierCsv(header+tooMany)).toThrow();
 });
 it("rejects duplicate refs, offsite links, malformed prices and URLs with embedded credentials",()=>{
  const head="supplier_ref,product_name,brand,pack_size,product_url,quoted_cost_bdt\n";
  expect(()=>parseHrSupplierCsv(head+"ABC,Cream One,COSRX,50ml,,\nABC,Cream Two,COSRX,50ml,,")).toThrow(/duplicate/);
  expect(()=>parseHrSupplierCsv(head+"ABC,Cream One,COSRX,50ml,https://evil.example/path,")).toThrow(/URL/);
  expect(()=>parseHrSupplierCsv(head+"ABC,Cream One,COSRX,50ml,,4.999")).toThrow();
  expect(isHrWebsite("https://hrwholesalecosmetics.com/product/sample-item")).toBe(true);
  expect(isHrWebsite("http://hrwholesalecosmetics.com/product/sample")).toBe(false);
  expect(isHrWebsite("https://hrwholesalecosmetics.com.evil.com/product/sample")).toBe(false);
 });
});
