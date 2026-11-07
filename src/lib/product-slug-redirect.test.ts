import {describe,it,expect} from "vitest";
import {historicalProductRedirectPath} from "./product-slug-redirect";
describe("permanent product URL redirects",()=>{
 it("redirects an old product slug to the currently published product path",()=>{
  expect(historicalProductRedirectPath("old-beauty-serum","new-beauty-serum")).toBe("/products/new-beauty-serum");
 });
 it("does not produce loops or redirect external destinations",()=>{
  expect(historicalProductRedirectPath("same","same")).toBeNull();
  expect(historicalProductRedirectPath("old","https://malicious.example")).toBeNull();
  expect(historicalProductRedirectPath("old","../admin")).toBeNull();
  expect(historicalProductRedirectPath("old","new?checkout=true")).toBeNull();
  expect(historicalProductRedirectPath("old","")).toBeNull();
  expect(historicalProductRedirectPath("invalid/slash","safe")).toBeNull();
 });
 it("permits only the application's normalized product slugs",()=>{
  expect(historicalProductRedirectPath("old-2025","product-2026")).toBe("/products/product-2026");
  expect(historicalProductRedirectPath("a","a".repeat(121))).toBeNull();
  expect(historicalProductRedirectPath("old","UPPER")).toBeNull();
 });
});
