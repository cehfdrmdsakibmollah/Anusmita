import {describe,it,expect} from "vitest";
import {cmsCssRuleSchema,cmsCssRulesSchema,safeCmsCssValue,renderCmsCssRules} from "./cms-css-rules";
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
