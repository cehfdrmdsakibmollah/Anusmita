
import {describe,it,expect} from "vitest";
import {storeMode,dedicatedDb,isProductionUrl,checkoutEnabled,launchFlags} from "./launch-config";
const configured={
 STORE_MODE:"live",MONGODB_URI:"mongodb+srv://user:password@cluster.example.com/anusmita?retryWrites=true",
 SESSION_SECRET:"012345678901234567890123456789ABCDEF",
 NEXT_PUBLIC_SITE_URL:"https://shop.anusmita.example",
};
describe("ANUSMITA safe launch behavior",()=>{
 it("is catalogue-only by default, never inferred from NODE_ENV",()=>{
  expect(storeMode(undefined)).toBe("catalog");
  expect(storeMode("LIVE")).toBe("catalog");
  expect(checkoutEnabled({...configured,STORE_MODE:undefined})).toBe(false);
 });
 it("requires a dedicated database",()=>{
  expect(dedicatedDb(configured.MONGODB_URI)).toBe(true);
  expect(dedicatedDb("mongodb+srv://u:p@cluster/Portfolio")).toBe(false);
  expect(dedicatedDb("mongodb+srv://u:p@cluster/")).toBe(false);
  expect(dedicatedDb("https://example.com/anusmita")).toBe(false);
 });
 it("rejects localhost and insecure production URL",()=>{
  expect(isProductionUrl("http://localhost:3000")).toBe(false);
  expect(isProductionUrl("https://shop.example")).toBe(true);
  expect(isProductionUrl("https://user:pass@shop.example")).toBe(false);
 });
 it("requires all safe launch flags",()=>{
  expect(checkoutEnabled(configured)).toBe(true);
  expect(checkoutEnabled({...configured,SESSION_SECRET:"weak"})).toBe(false);
  expect(checkoutEnabled({...configured,NEXT_PUBLIC_SITE_URL:"http://localhost:3000"})).toBe(false);
  expect(launchFlags(configured).cloudinaryConfigured).toBe(false);
 });
});
