import {describe,it,expect} from "vitest";
import {restoreSeoRevisionDraft,seoRevisionSnapshot} from "./product-seo-revisions";
const current={revision:8,metaTitle:"Current SEO",metaDescription:"Current description",focusKeyword:"beauty",keywords:["beauty"],imageAltTexts:["Image one"],ogTitle:"Social current",ogDescription:"Current social",robotsIndex:true,robotsFollow:true,schemaEnabled:true};
describe("product SEO immutable revision history",()=>{
 it("copies all editable metadata and never modifies source arrays",()=>{
  const snapshot=seoRevisionSnapshot(current);
  expect(snapshot).not.toHaveProperty("revision");
  snapshot.keywords.push("new");
  snapshot.imageAltTexts[0]="Changed";
  expect(current.keywords).toEqual(["beauty"]);
  expect(current.imageAltTexts).toEqual(["Image one"]);
 });
 it("restores content locally while keeping the latest CAS revision",()=>{
  const previous={...seoRevisionSnapshot(current),metaTitle:"Historical title",keywords:["historical"],robotsIndex:false};
  const restored=restoreSeoRevisionDraft(current,previous);
  expect(restored.metaTitle).toBe("Historical title");
  expect(restored.revision).toBe(8);
  expect(restored.robotsIndex).toBe(false);
  restored.keywords.push("draft");
  expect(previous.keywords).toEqual(["historical"]);
  expect(current.metaTitle).toBe("Current SEO");
 });
});
