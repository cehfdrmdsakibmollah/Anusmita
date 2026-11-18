import {describe,it,expect} from "vitest";
import {maintenanceExemptPath,maintenanceHtml} from "./maintenance-access";
describe("maintenance access",()=>{
 it("keeps administration, callbacks and existing receipts reachable",()=>{
  for(const path of ["/admin","/admin/login","/api/webhooks/steadfast","/order-success","/order-success/invoice"])
   expect(maintenanceExemptPath(path)).toBe(true);
  for(const path of ["/","/shop","/checkout","/administrator","/order-successful"])
   expect(maintenanceExemptPath(path)).toBe(false);
 });
 it("escapes the operator message before rendering HTML",()=>{
  expect(maintenanceHtml('<img src=x onerror="alert(1)">')).toContain("&lt;img");
  expect(maintenanceHtml("<script>")).not.toContain("<script>");
 });
});
