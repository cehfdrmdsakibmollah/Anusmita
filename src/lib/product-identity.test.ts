import {describe,it,expect} from "vitest";
import {productIdentityQuery,nextProductIdentity,duplicateProductIdentityField} from "./product-identity";
describe("product identity collision guidance",()=>{
 it("rejects invalid identifier queries",()=>{
  expect(productIdentityQuery.safeParse({sku:"ANUS-JP-002-1",slug:"senka-whip"}).success).toBe(true);
  expect(productIdentityQuery.safeParse({sku:"a",slug:"senka-whip"}).success).toBe(false);
  expect(productIdentityQuery.safeParse({sku:"ANUS-JP-002-1",slug:"javascript:bad"}).success).toBe(false);
  expect(productIdentityQuery.safeParse({sku:"ANUS-JP-002-1",slug:"senka-whip",permission:"admin"}).success).toBe(false);
 });
 it("recommends the first unused suffix without overwriting the original",()=>{
  expect(nextProductIdentity("ANUS-JP-002-1",v=>["ANUS-JP-002-1-2","ANUS-JP-002-1-3"].includes(v))).toBe("ANUS-JP-002-1-4");
  expect(nextProductIdentity("x".repeat(60),()=>false)).toHaveLength(60);
 });
 it("distinguishes duplicate SKU from duplicate SEO slug",()=>{
  expect(duplicateProductIdentityField({code:11000,keyPattern:{sku:1}})).toBe("sku");
  expect(duplicateProductIdentityField({code:11000,keyValue:{slug:"some-product"}})).toBe("slug");
  expect(duplicateProductIdentityField({code:403,keyPattern:{sku:1}})).toBe(null);
 });
});
