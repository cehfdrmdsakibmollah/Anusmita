import {describe,it,expect} from "vitest";
import {normalizedSeo,verifySeoPersistence,type SavedSeoSnapshot} from "./product-seo-persistence";
const base:SavedSeoSnapshot={
 revision:3,metaTitle:"Gentle Centella Ampoule | ANUSMITA",metaDescription:"A gentle centella ampoule for everyday skincare with an accurate product description from the merchant.",focusKeyword:"centella ampoule",
 keywords:["Centella","Skincare"],imageAltTexts:["Clear bottle of centella ampoule"],ogTitle:"Centella Ampoule",ogDescription:"Simple skincare",robotsIndex:true,robotsFollow:true,schemaEnabled:true
};
describe("Product SEO save → refresh persistence guard",()=>{
 it("accepts exact persisted revision and normalized server text/keywords",()=>{
  const stored={...base,metaTitle:" Gentle Centella Ampoule | ANUSMITA ",keywords:["centella","skincare"]};
  expect(verifySeoPersistence(base,stored)).toEqual({verified:true,differences:[]});
 });
 it("rejects stale revision even when text matches",()=>{
  const result=verifySeoPersistence(base,{...base,revision:4});
  expect(result.verified).toBe(false);
  expect(result.differences).toContain("revision");
 });
 it("detects missing persisted meta, image alt and noindex switch",()=>{
  const result=verifySeoPersistence(base,{...base,metaDescription:"",imageAltTexts:[],robotsIndex:false});
  expect(result.verified).toBe(false);
  expect(result.differences).toEqual(expect.arrayContaining(["metaDescription","imageAltTexts","robotsIndex"]));
 });
 it("does not mutate submitted state during normalization",()=>{
  const before=structuredClone(base);normalizedSeo(base);expect(base).toEqual(before);
 });
});
