import {describe,it,expect} from "vitest";
import {canPublishReview,complementaryCategories,reviewEmptyLabel} from "./product-trust";
describe("customer trust and product pairing gates",()=>{
 const approved={consentToPublish:true,submittedByCustomer:true,verifiedPurchase:true,moderationStatus:"approved",verifiedAt:new Date("2026-01-01T00:00:00Z")};
 it("publishes only fully validated verified review records",()=>{
  expect(canPublishReview(approved)).toBe(true);
  for(const field of ["consentToPublish","submittedByCustomer","verifiedPurchase"] as const)expect(canPublishReview({...approved,[field]:false})).toBe(false);
  expect(canPublishReview({...approved,moderationStatus:"pending"})).toBe(false);
  expect(canPublishReview({...approved,verifiedAt:null})).toBe(false);
  expect(canPublishReview({...approved,verifiedAt:new Date(NaN)})).toBe(false);
 });
 it("chooses only categories, never invents products or prices",()=>{
  expect(complementaryCategories("Fashion")).toContain("Bags");
  expect(complementaryCategories("Skincare")).toContain("Beauty");
  expect(complementaryCategories("unknown")).toEqual([]);
  expect(reviewEmptyLabel(0)).toContain("No verified");
 });
});