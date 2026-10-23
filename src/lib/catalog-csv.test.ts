
import { describe,it,expect } from "vitest";
import {parseCells,csvRows,toPaisa,csvCell,CSV_TEMPLATE,CsvError} from "./catalog-csv";
describe("catalogue CSV safety",()=>{
 it("accepts a UTF-8 BOM, quoted commas and multiline descriptions",()=>{
  expect(parseCells('\uFEFFsku,name,description\r\nS1,"Hello, world","Line 1\nLine 2"\r\n')[1]).toEqual(["S1","Hello, world","Line 1\nLine 2"]);
 });
 it("converts money exactly to paisa",()=>{
  expect(toPaisa("199.99","price")).toBe(19999);
  expect(toPaisa("0.05","price")).toBe(5);
  expect(()=>toPaisa("999.999","price")).toThrow(CsvError);
 });
 it("keeps absent update fields out of changes",()=>{
  const [row]=csvRows("sku,name,price_bdt,cost_bdt,active,opening_stock\nSKUA01,Example,150.00,,,\n");
  expect(row.changes).toEqual({name:"Example",pricePaisa:15000});
  expect(row.openingStock).toBeUndefined();
 });
 it("rejects duplicate rows and malformed CSV",()=>{
  expect(()=>csvRows("sku,name\nSKU01,Example\nSKU01,Other")).toThrow(/duplicate SKU/);
  expect(()=>csvRows('sku,name\nSKU01,"bad')).toThrow(/Unterminated/);
 });
 it("does not allow unsafe image URLs",()=>{
  expect(()=>csvRows("sku,image_urls\nSKU01,http://example.com/image.jpg")).toThrow(/HTTPS/);
 });
 it("preserves spreadsheet formula safety",()=>{
  expect(csvCell("=2+2")).toBe("'=2+2");
  expect(csvCell("a,b")).toBe('"a,b"');
 });
 it("provides an import example",()=>expect(csvRows(CSV_TEMPLATE)).toHaveLength(1));
});
