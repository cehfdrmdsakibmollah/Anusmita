import {describe,it,expect} from "vitest";
import {cmsCssRuleSchema,cmsCssRulesSchema,safeCmsCssValue,renderCmsCssRules,renderNativeCmsCssRules,validateNativeCmsCssScopes,nativeCmsFieldScope} from "./cms-css-rules";
import {cmsNativeHeroSchema,cmsSlotSchema,defaultCmsStyle} from "./cms-page-slots";
const rule={target:"card" as const,state:"hover" as const,property:"box-shadow" as const,value:"0 8px 24px #e8c8d5"};
describe("strict visual CSS editor",()=>{
 it("supports shadow, hover, geometry, typography and safe transitions",()=>{
  for(const [property,value] of [["box-shadow","0 8px 24px #e8c8d5"],["width","100%"],["height","300px"],["font-weight","700"],["transform","scale(1.03)"],["transition","all 200ms ease"],["padding","12px 18px"],["border","1px solid #cccccc"]]){
   expect(safeCmsCssValue(property,value)).toBe(true);
  }
 });
 it("rejects URL injection, CSS breakout, imports and unsupported properties",()=>{
  for(const value of ["url(https://evil.example/a)","1px;position:fixed","red}body{display:none","@import","expression(alert(1))"]){
   expect(safeCmsCssValue("box-shadow",value)).toBe(false);
  }
  expect(cmsCssRuleSchema.safeParse({...rule,property:"position",value:"fixed"}).success).toBe(false);
  expect(cmsCssRulesSchema.safeParse(Array(33).fill(rule)).success).toBe(false);
 });
 it("scopes every comma-separated CSS selector and adds developer-controlled precedence",()=>{
  const result=renderCmsCssRules([rule],'.page-x',{hero:'.hero, .grid',heading:'h2',card:'.card, .tiles',button:'a',image:'img'});
  expect(result).toContain('.page-x .card:hover{box-shadow:0 8px 24px #e8c8d5 !important}');
  expect(result).toContain('.page-x .tiles:hover{box-shadow:0 8px 24px #e8c8d5 !important}');
  expect(result).not.toContain('\n.tiles:hover');
 });
 it("retains existing CMS pages without style overrides",()=>{
  expect(cmsNativeHeroSchema.parse({}).cssRules).toEqual([]);
  const block=cmsSlotSchema.parse({id:"81d346fb-42ad-4e93-811b-98d2d3304b30",placement:"before",kind:"banner",style:defaultCmsStyle,title:"Safe title",position:0});
  expect(block.cssRules).toEqual([]);
  expect(cmsSlotSchema.safeParse({...block,cssRules:[{...rule,value:"url(x)"}]}).success).toBe(false);
 });
});

describe("native selected promotional card styling",()=>{
 it("only accepts server-defined card identifiers for the selected page",()=>{
  const scoped={...rule,elementId:"serum"};
  expect(cmsCssRuleSchema.safeParse(scoped).success).toBe(true);
  expect(validateNativeCmsCssScopes("deals",[scoped])).toBe(true);
  expect(validateNativeCmsCssScopes("bundles",[scoped])).toBe(false);
  expect(validateNativeCmsCssScopes("shop",[scoped])).toBe(false);
  expect(validateNativeCmsCssScopes("deals",[{...scoped,elementId:"unknown"}])).toBe(false);
  expect(cmsCssRuleSchema.safeParse({...scoped,elementId:'serum"] body'}).success).toBe(false);
 });
 it("styles only a specific real card and its image; generic rules remain unchanged",()=>{
  const css=renderNativeCmsCssRules("deals",[
   {...rule,elementId:"serum"},
   {target:"image",elementId:"serum",state:"normal",property:"object-fit",value:"contain"},
   {target:"heading",state:"normal",property:"font-size",value:"28px"}
  ]);
  expect(css).toContain('body .dp-card[data-cms-promo-id="serum"]:hover{box-shadow:0 8px 24px #e8c8d5 !important}');
  expect(css).toContain('body .dp-card[data-cms-promo-id="serum"] .dp-product-photo img{object-fit:contain !important}');
  expect(css).toContain('body .dp-hero h1{font-size:28px !important}');
  expect(css).not.toContain('body .dp-card:hover');
  expect(renderNativeCmsCssRules("deals",[{...rule,elementId:"bad"}])).toBe("");
 });
 it("rejects per-native-element scopes on independent CMS section blocks",()=>{
  const slot={id:"550e8400-e29b-41d4-a716-446655440000",placement:"before",title:"Safe card",position:0};
  expect(cmsSlotSchema.safeParse({...slot,cssRules:[{...rule,elementId:"serum"}]}).success).toBe(false);
  expect(cmsNativeHeroSchema.safeParse({cssRules:[{...rule,elementId:"serum"}]}).success).toBe(true);
 });
});

describe("real selected native field style persistence",()=>{
 it("maps picked Deals heading and hero media to the same published selectors",()=>{
  expect(nativeCmsFieldScope("deals","sectionTitle","heading")).toBe("#deals-title");
  expect(nativeCmsFieldScope("deals","imageUrl","image")).toContain(".dp-cms-hero-image");
  expect(nativeCmsFieldScope("deals","sectionImageUrl","image")).toContain(".dp-native-section-image");
  expect(nativeCmsFieldScope("deals","sectionTitle","image")).toBe(null);
  expect(nativeCmsFieldScope("checkout","sectionImageUrl","image")).toBe(null);
 });
 it("accepts approved field CSS but rejects invalid target or injection",()=>{
  const valid={target:"heading" as const,state:"normal" as const,elementId:"sectionTitle",property:"color" as const,value:"#a12345"};
  expect(cmsNativeHeroSchema.safeParse({cssRules:[valid]}).success).toBe(true);
  expect(validateNativeCmsCssScopes("deals",[valid])).toBe(true);
  expect(validateNativeCmsCssScopes("deals",[{...valid,target:"image"}])).toBe(false);
  expect(validateNativeCmsCssScopes("deals",[{...valid,elementId:"arbitrary-selector"}])).toBe(false);
  const css=renderNativeCmsCssRules("deals",[valid,{...valid,elementId:"imageUrl",target:"image",property:"object-fit",value:"contain"}]);
  expect(css).toContain("body #deals-title{color:#a12345 !important}");
  expect(css).toContain("body .dp-hero>.dp-cms-hero-image{object-fit:contain !important}");
  expect(css).not.toContain("body .dp-hero h1{color:#a12345");
 });
 it("preserves unscoped page-level rules",()=>{
  const rule={target:"hero" as const,state:"normal" as const,property:"background-color" as const,value:"#fff4f7"};
  expect(renderNativeCmsCssRules("deals",[rule])).toContain("body .dp-hero{background-color:#fff4f7 !important}");
 });
});
