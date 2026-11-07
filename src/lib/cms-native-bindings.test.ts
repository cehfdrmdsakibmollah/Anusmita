import {describe,it,expect} from "vitest";
import {cmsSlotPages,cmsNativeHeroSchema,cmsSlotSchema} from "./cms-page-slots";
import {nativeTextTargets,cmsNativeTextSchema,validatePageNativeText} from "./cms-native-bindings";
import {nativePromoIds,validateNativePromoIds} from "./cms-promo-bindings";
const card={id:"11111111-1111-4111-8111-111111111111",title:"Parent card",subtitle:"",imageUrl:"",cta:"View",href:"/shop"};
const leaf={id:"22222222-2222-4222-8222-222222222222",title:"Nested detail",subtitle:"Details",imageUrl:"",cta:"Explore",href:"/shop"};
describe("Native promotional and nested CMS bindings",()=>{
 it("has an explicit safe editorial selector registry across 14 pages",()=>{
  expect(cmsSlotPages).toHaveLength(14);
  for(const page of cmsSlotPages)expect(nativeTextTargets[page]).toBeDefined();
  expect(nativeTextTargets.deals.promoHeading).toBe(".dp-editorial h2");
  expect(nativeTextTargets.contact.formHeading).toBe(".ip-form-card h2");
 });
 it("rejects cross-page targets and duplicated binding names",()=>{
  expect(validatePageNativeText("contact",[{key:"formHeading",text:"Write to us",enabled:true}])).toBe(true);
  expect(validatePageNativeText("checkout",[{key:"formHeading",text:"Fake checkout form",enabled:true}])).toBe(false);
  expect(cmsNativeTextSchema.safeParse([{key:"promoHeading",text:"One"},{key:"promoHeading",text:"Two"}]).success).toBe(false);
  expect(cmsNativeTextSchema.safeParse([{key:"untrusted",text:"Price"}]).success).toBe(false);
 });
 it("preserves legacy records and validates safe nested card layouts",()=>{
  expect(cmsNativeHeroSchema.parse({}).textBindings).toEqual([]);
  const slot=cmsSlotSchema.parse({id:"33333333-3333-4333-8333-333333333333",kind:"grid",title:"Editorial tiles",position:0,placement:"before",children:[{...card,subcards:[leaf]}]});
  expect(slot.children[0].subcards[0].title).toBe("Nested detail");
  const legacy=cmsSlotSchema.parse({id:"33333333-3333-4333-8333-333333333333",title:"Old grid",kind:"grid",position:0,placement:"before",children:[card]});
  expect(legacy.children[0].subcards).toEqual([]);
  expect(cmsSlotSchema.safeParse({...slot,children:[{...card,subcards:[{...leaf,href:"javascript:alert(1)"}]}]}).success).toBe(false);
 });
 it("limits native promotional card editing to known Deals/Bundles preview IDs",()=>{
  expect(nativePromoIds.deals).toHaveLength(8);
  expect(validateNativePromoIds("deals",[{id:"serum"},{id:"lipstick"}])).toBe(true);
  expect(validateNativePromoIds("bundles",[{id:"serum"}])).toBe(false);
  expect(validateNativePromoIds("checkout",[{id:"serum"}])).toBe(false);
  expect(validateNativePromoIds("deals",[{id:"serum"},{id:"serum"}])).toBe(false);
  expect(cmsNativeHeroSchema.safeParse({promoCards:[{id:"serum",title:"New editorial headline",imageUrl:"javascript:alert(1)"}]}).success).toBe(false);
 });
 it("limits nested depth and cardinality",()=>{
  const slot={id:"33333333-3333-4333-8333-333333333333",kind:"grid",title:"Bounded",placement:"before",position:0,children:[{...card,subcards:Array(5).fill(0).map((_,i)=>({...leaf,id:`22222222-2222-4222-8222-22222222222${i}`}))}]};
  expect(cmsSlotSchema.safeParse(slot).success).toBe(false);
  const illegal={...leaf,subcards:[leaf]};
  expect(cmsSlotSchema.safeParse({...slot,children:[{...card,subcards:[illegal]}]}).success).toBe(false);
 });
});
