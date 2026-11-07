import {z} from "zod";
/** Validated per-component CSS declarations. Arbitrary CSS selectors, URLs, imports, and scripts are not accepted. */
export const cmsCssTargets=["hero","heading","card","button","image"] as const;
export const cmsCssStates=["normal","hover"] as const;
export const cmsCssProperties=[
 "width","height","min-height","max-width","font-size","font-weight","line-height",
 "letter-spacing","color","background-color","border","border-radius","box-shadow",
 "padding","margin","opacity","transform","transition","gap","object-fit"
] as const;
export const cmsCssRuleSchema=z.object({
 target:z.enum(cmsCssTargets),
 state:z.enum(cmsCssStates).default("normal"),
 property:z.enum(cmsCssProperties),
 value:z.string().trim().min(1).max(95)
}).strict().superRefine((rule,ctx)=>{
 if(!safeCmsCssValue(rule.property,rule.value))ctx.addIssue({code:"custom",path:["value"],message:"Unsupported or unsafe CSS value"});
});
export const cmsCssRulesSchema=z.array(cmsCssRuleSchema).max(32);
export type CmsCssRule=z.infer<typeof cmsCssRuleSchema>;
const length="(?:0|-?\\d+(?:\\.\\d+)?(?:px|%|rem|em|vh|vw))";
const color="(?:#[0-9a-fA-F]{3,8}|transparent|currentColor|rgba?\\([0-9., %]+\\))";
const numeric=/^(?:0|\d+(?:\.\d+)?)$/;
export function safeCmsCssValue(property:string,value:string):boolean{
 const v=value.trim();
 if(!v||/[;{}<>\\\\]/.test(v)||/url|var\s*\(|expression|@import|!important|javascript|behavior/i.test(v))return false;
 const len=new RegExp("^"+length+"$");
 const spacing=new RegExp("^"+length+"(?:\\s+"+length+"){0,3}$");
 switch(property){
 case "width":case "height":case "min-height":case "max-width":return v==="auto"||len.test(v);
 case "font-size":case "letter-spacing":case "border-radius":case "gap":return len.test(v);
 case "font-weight":return /^(?:normal|bold|[1-9]00)$/.test(v);
 case "line-height":return numeric.test(v)||len.test(v);
 case "color":case "background-color":return new RegExp("^"+color+"$").test(v);
 case "padding":case "margin":return spacing.test(v)||v==="auto";
 case "opacity":return numeric.test(v)&&Number(v)<=1;
 case "border":return new RegExp("^(?:none|"+length+"\\s+(?:solid|dashed|dotted)\\s+"+color+")$").test(v);
 case "box-shadow":return v==="none"||new RegExp("^(?:inset\\s+)?"+length+"\\s+"+length+"\\s+"+length+"(?:\\s+"+length+")?\\s+"+color+"$").test(v);
 case "transform":return v==="none"||/^scale\((?:0?\.\d+|1(?:\.\d+)?)\)$/.test(v);
 case "transition":return /^(?:none|all (?:100|150|200|250|300|400|500)ms ease)$/.test(v);
 case "object-fit":return /^(?:cover|contain|fill|none|scale-down)$/.test(v);
 default:return false;
 }
}
export const nativeCmsSelectors:Record<string,string>={
 shop:".anShopHero",deals:".dp-hero",bundles:".bp-hero",about:".aboutHero",contact:".contactHero",journal:".journalHero",
 cart:".shoppingPage",checkout:".shoppingPage",wishlist:".shoppingPage",
 "gift-cards":".gc-hero","pre-orders":".po-hero","customer-stories":".cs-hero","routine-quiz":".rq-hero","track-order":".to-hero"
};
export const nativeCmsCardSelectors:Record<string,string>={
 shop:".anShopNewCard",deals:".dp-card",bundles:".bp-card",
 "gift-cards":".gc-card","pre-orders":".po-grid article",
 "customer-stories":".cs-grid article","routine-quiz":".rq-panel",
 "track-order":".to-result",cart:".shoppingLine",checkout:".shoppingLine",wishlist:".shoppingLine",
 about:".anCmsPublicNestedCard",contact:".anCmsPublicNestedCard",journal:".anCmsPublicNestedCard"
};
export function renderCmsCssRules(rules:readonly CmsCssRule[],scope:string,targets:Record<CmsCssRule["target"],string>):string{
 const result:string[]=[];
 for(const rule of rules){
  if(!safeCmsCssValue(rule.property,rule.value))continue;
  const selector=targets[rule.target];
  if(!selector)continue;
  const state=rule.state==="hover"?":hover":"";
  for(const part of selector.split(",").map(x=>x.trim()).filter(Boolean))result.push(scope+" "+part+state+"{"+rule.property+":"+rule.value+" !important}");
 }
 return result.join("\n");
}
export const slotCssSelectors={hero:":scope",heading:"h2",card:".anCmsPublicNestedCard",button:"a",image:"img"};
