import {describe,expect,it} from "vitest";
import {cmsSlotPages} from "./cms-page-slots";
import {nativeCmsSelectors,nativeCmsCardSelectors,renderCmsCssRules} from "./cms-css-rules";
describe("Real native page visual selection",()=>{
 it("registers a native hero selector for every editable storefront route",()=>{
  for(const page of cmsSlotPages)expect(nativeCmsSelectors[page]).toMatch(/^\.[A-Za-z][A-Za-z0-9-]*$/);
 });
 it("uses real Deals, Bundles and information page selectors instead of old placeholder selectors",()=>{
  expect(nativeCmsSelectors.deals).toBe(".dp-hero");
  expect(nativeCmsSelectors.bundles).toBe(".bp-hero");
  expect(nativeCmsSelectors.about).toBe(".ip-about-hero");
  expect(nativeCmsSelectors.contact).toBe(".ip-contact-hero");
  expect(nativeCmsCardSelectors.deals).toBe(".dp-card");
 });
 it("scopes image styling to real image and SVG art in actual page",()=>{
  const hero=nativeCmsSelectors.deals;
  const css=renderCmsCssRules([{target:"image",state:"normal",property:"object-fit",value:"contain"}],"body",{hero,heading:hero+" h1",card:".dp-card",button:hero+" a",image:hero+" img, "+hero+" svg"});
  expect(css).toContain("body .dp-hero img{object-fit:contain !important}");
  expect(css).toContain("body .dp-hero svg{object-fit:contain !important}");
 });
});
