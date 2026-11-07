import {nativePromoIds} from "@/lib/cms-promo-bindings";
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
 elementId:z.string().regex(/^[a-z][a-z0-9-]{0,39}$/).optional(),
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
 shop:".anShopHero",deals:".dp-hero",bundles:".bp-hero",about:".ip-about-hero",contact:".ip-contact-hero",journal:".ip-journal-hero",
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

/** Page-owned presentation fields, never arbitrary CSS selectors or commerce state. */
export const nativeCmsFieldSelectors:Record<string,Partial<Record<"title"|"subtitle"|"sectionTitle"|"imageUrl"|"sectionImageUrl",string>>>={
 deals:{title:".dp-hero h1",subtitle:".dp-hero-copy p",sectionTitle:"#deals-title",imageUrl:".dp-hero>.dp-cms-hero-image, .dp-hero>.dp-hero-photo",sectionImageUrl:".dp-editorial>.dp-native-section-image, .dp-editorial>.dp-art"},
 bundles:{title:".bp-hero h1",subtitle:".bp-hero p",sectionTitle:"#routine-title",imageUrl:".bp-hero>.bp-cms-hero-image, .bp-hero>.bp-hero-desktop, .bp-hero>.bp-hero-mobile",sectionImageUrl:".bp-feature-photo"},
 shop:{title:".anShopHero h1",subtitle:".anShopHero p",sectionTitle:".anShopHeading h2"},
 "gift-cards":{title:".gc-hero h1",subtitle:".gc-hero p",sectionTitle:"#gc-title"},
 "pre-orders":{title:".po-hero h1",subtitle:".po-hero p",sectionTitle:"#po-journey-title"},
 "customer-stories":{title:".cs-hero h1",subtitle:".cs-hero p",sectionTitle:"#cs-gallery-title"},
 "routine-quiz":{title:".rq-hero h1",subtitle:".rq-hero p",sectionTitle:".rq-help h2"},
 "track-order":{title:".to-hero h1",subtitle:".to-hero p",sectionTitle:"#to-form-title"},
 cart:{title:".anFlowHero h1",subtitle:".anFlowHero p",sectionTitle:".anFlowHero h2"},
 checkout:{title:".anFlowCheckoutIntro h1",subtitle:".anFlowCheckoutIntro p",sectionTitle:".anFlowCheckoutIntro h2"},
 wishlist:{title:".shoppingPage h1",sectionTitle:".sheetEmpty h2"},
 about:{title:".ip-about-hero h1"},contact:{title:".ip-contact-hero h1"},journal:{title:".ip-journal-hero h1"}
};
export function nativeCmsFieldScope(page:string,elementId:string,target:CmsCssRule["target"]):string|null{
 const fields=nativeCmsFieldSelectors[page];
 const key=elementId as keyof NonNullable<typeof fields>;
 const selector=fields?.[key];
 if(!selector)return null;
 if(key==="imageUrl"||key==="sectionImageUrl")return target==="image"?selector:null;
 if(key==="title"||key==="subtitle"||key==="sectionTitle")return target==="heading"?selector:null;
 return null;
}

/** Native per-card scopes are server-defined IDs, never user-supplied CSS selectors. */
export function validateNativeCmsCssScopes(page:string,rules:readonly CmsCssRule[]):boolean{
 const ids=page==="deals"||page==="bundles"?new Set<string>(nativePromoIds[page]):new Set<string>();
 return rules.every(rule=>!rule.elementId||ids.has(rule.elementId)||!!nativeCmsFieldScope(page,rule.elementId,rule.target));
}

/** Shared by public pages and preview to avoid editor/public selector drift. */
export function renderNativeCmsCssRules(page:string,rules:readonly CmsCssRule[],scope="body"):string{
 const hero=nativeCmsSelectors[page];
 if(!hero)return "";
 const card=nativeCmsCardSelectors[page]||".anCmsPublicNestedCard";
 const defaults={hero,heading:hero+" h1",card,button:hero+" a, "+hero+" button",image:hero+" img, "+hero+" svg"};
 const output:string[]=[];
 for(const rule of rules){
  if(!safeCmsCssValue(rule.property,rule.value))continue;
  if(!rule.elementId){output.push(renderCmsCssRules([rule],scope,defaults));continue;}
  if(!validateNativeCmsCssScopes(page,[rule]))continue;
  const fieldSelector=nativeCmsFieldScope(page,rule.elementId,rule.target);
  if(fieldSelector){output.push(renderCmsCssRules([{...rule,elementId:undefined}],scope,{...defaults,[rule.target]:fieldSelector}));continue;}
  const base=card+'[data-cms-promo-id="'+rule.elementId+'"]';
  const scoped=rule.target==="card"?base:
   rule.target==="heading"?base+" h3":
   rule.target==="button"?base+" button, "+base+" a":
   rule.target==="image"?base+" .dp-product-photo img, "+base+" .dp-product-photo svg, "+base+" .bp-card-photo img, "+base+" .bp-card-photo svg":
   "";
  if(scoped)output.push(renderCmsCssRules([{...rule,elementId:undefined}],scope,{...defaults,[rule.target]:scoped}));
 }
 return output.filter(Boolean).join("\n");
}
