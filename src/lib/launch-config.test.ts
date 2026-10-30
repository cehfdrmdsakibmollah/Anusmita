
import {describe,it,expect} from "vitest";
import {ATLAS_HOST,ATLAS_DB,ATLAS_APP_USER,storeMode,dedicatedDb,isProductionUrl,checkoutEnabled,launchFlags} from "./launch-config";
const uri="mongodb+srv://"+ATLAS_APP_USER+":encoded%40password@"+ATLAS_HOST+"/"+ATLAS_DB+"?retryWrites=true&w=majority";
const configured={STORE_MODE:"live",MONGODB_URI:uri,SESSION_SECRET:"012345678901234567890123456789ABCDEF",NEXT_PUBLIC_SITE_URL:"https://shop.anusmita.example"};
describe("ANUSMITA safe launch behavior",()=>{
 it("remains catalogue-only until explicit launch",()=>{
  expect(storeMode(undefined)).toBe("catalog");
  expect(storeMode("LIVE")).toBe("catalog");
  expect(checkoutEnabled({...configured,STORE_MODE:undefined})).toBe(false);
 });
 it("requires the right cluster, database, and least-privilege user",()=>{
  expect(dedicatedDb(uri)).toBe(true);
  expect(dedicatedDb(uri.replace(ATLAS_HOST,"unapproved-cluster.example.mongodb.net"))).toBe(false);
  expect(dedicatedDb(uri.replace("/anusmita?","/Portfolio?"))).toBe(false);
  expect(dedicatedDb(uri.replace(ATLAS_APP_USER,"portfolio_admin"))).toBe(false);
  expect(dedicatedDb(uri.replace("encoded%40password","%3CPASSWORD%3E"))).toBe(false);
  expect(dedicatedDb("https://example.com/anusmita")).toBe(false);
  expect(dedicatedDb("mongodb://localhost/anusmita")).toBe(false);
 });
 it("requires HTTPS public origin",()=>{
  expect(isProductionUrl("http://localhost:3000")).toBe(false);
  expect(isProductionUrl("https://shop.example")).toBe(true);
  expect(isProductionUrl("https://user:pass@shop.example")).toBe(false);
 });
 it("requires all live mode gates and does not reveal the password",()=>{
  expect(checkoutEnabled(configured)).toBe(true);
  expect(checkoutEnabled({...configured,SESSION_SECRET:"weak"})).toBe(false);
  expect(checkoutEnabled({...configured,NEXT_PUBLIC_SITE_URL:"http://localhost:3000"})).toBe(false);
  expect(launchFlags(configured).cloudinaryConfigured).toBe(false);
  expect(JSON.stringify(launchFlags(configured))).not.toContain("encoded");
 });
});
