import {describe,it,expect} from "vitest";
import {funnelWrite,funnelContent,safeFunnelStyle,safeFunnelUrl,initialFunnelBlock} from "./funnel-pages";
const base=()=>({slug:"beauty-serum",revision:0,mode:"draft",content:{title:"Beauty Serum Landing Page",description:"Limited offer",seoTitle:"Beauty Serum",noIndex:false,blocks:[initialFunnelBlock("hero")]}});
describe("secure ANUSMITA funnel campaign contracts",()=>{
 it("validates a structured, editable campaign",()=>{
  expect(funnelWrite.safeParse(base()).success).toBe(true);
  expect(funnelContent.safeParse(base().content).success).toBe(true);
 });
 it("blocks unknown script-like properties and forged publishing flags",()=>{
  expect(funnelWrite.safeParse({...base(),content:{...base().content,blocks:[{...initialFunnelBlock("hero"),script:"alert(1)"}]}}).success).toBe(false);
  expect(funnelWrite.safeParse({...base(),dbName:"anusmita_shop"}).success).toBe(false);
 });
 it("rejects duplicated element IDs, unsafe CSS injection and malformed slugs",()=>{
  const block=initialFunnelBlock("hero");
  expect(funnelWrite.safeParse({...base(),content:{...base().content,blocks:[block,block]}}).success).toBe(false);
  expect(funnelWrite.safeParse({...base(),slug:"../admin"}).success).toBe(false);
  expect(safeFunnelStyle({backgroundColor:"red;position:fixed",padding:"10px; transform:scale(5)",width:"100%"})).toEqual({width:"100%"});
 });
 it("blocks javascript/data link schemes",()=>{
  expect(safeFunnelUrl("javascript:alert(1)")).toBe("");
  expect(safeFunnelUrl("data:text/html,evil")).toBe("");
  expect(safeFunnelUrl("/shop")).toBe("/shop");
  expect(safeFunnelUrl("https://example.com")).toBe("https://example.com");
  expect(safeFunnelUrl("http://example.com/file.jpg",true)).toBe("");
 });
 it("does not accept unbounded page content",()=>{
  const content={...base().content,title:"a".repeat(101)};
  expect(funnelContent.safeParse(content).success).toBe(false);
 });
});
