import {describe,expect,it} from "vitest";
import {analyzeSeo,autoSeo,canonical,localScore,makeProductSchema,type SeoFacts,type SeoFields} from "./product-seo-audit";
const product:SeoFacts={name:"Madagascar Centella Ampoule",slug:"madagascar-centella-ampoule",brand:"Skin1004",category:"Skincare",description:"A gentle soothing ampoule made with centella asiatica. Suitable for everyday hydrating routines.",imageUrls:["https://example.com/image.webp"],active:true,sku:"ANUS-101",pricePaisa:245000,onHand:6,reserved:2};
const fields:SeoFields={metaTitle:"",metaDescription:"",focusKeyword:"Centella",keywords:["centella"],imageAltTexts:["Clear glass ampoule bottle"],ogTitle:"",ogDescription:"",robotsIndex:true,robotsFollow:true,schemaEnabled:true};
describe("product SEO editor factual audit",()=>{
 it("generates safe fallback without invented rankings or customer reviews",()=>{
  const seo=autoSeo(product);
  expect(seo.title).toContain("Madagascar Centella");
  expect(seo.description).toContain("soothing ampoule");
  expect(seo.title.length).toBeLessThanOrEqual(70);
 });
 it("uses canonical real product URL, not the submitted mockup sample URL",()=>{
  expect(canonical(product.slug)).toBe("https://anusmita.netlify.app/products/madagascar-centella-ampoule");
 });
 it("only exposes factual price, stock and SKU in schema",()=>{
  const schema=makeProductSchema(product,fields);
  expect(schema?.offers?.price).toBe("2450.00");
  expect(schema?.offers?.availability).toContain("InStock");
  expect(JSON.stringify(schema)).not.toContain("aggregateRating");
  expect(JSON.stringify(schema)).not.toContain("priceValidUntil");
  expect(makeProductSchema(product,{...fields,schemaEnabled:false})).toBe(null);
  expect(makeProductSchema({...product,onHand:1,reserved:1},fields)?.offers?.availability).toContain("OutOfStock");
 });
 it("distinguishes editorial heuristic from unverified external signals",()=>{
  const checks=analyzeSeo(product,fields);
  expect(checks.find(c=>c.id==="reviews")?.ok).toBe(false);
  expect(checks.find(c=>c.id==="schema-test")?.ok).toBe(false);
  expect(checks.find(c=>c.id==="image")?.ok).toBe(true);
  expect(localScore(checks)).toBeLessThan(100);
  expect(analyzeSeo({...product,active:false},fields).find(c=>c.id==="robots")?.ok).toBe(false);
 });
});
