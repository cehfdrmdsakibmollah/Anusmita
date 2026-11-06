import type {SeoFields} from "./product-seo-audit";

export type SavedSeoSnapshot=SeoFields&{revision:number};
const textKeys=["metaTitle","metaDescription","focusKeyword","ogTitle","ogDescription"] as const;
export function normalizedSeo(value:SavedSeoSnapshot):SavedSeoSnapshot{
 const out={...value,keywords:[...new Set(value.keywords.map(v=>v.trim().toLowerCase()))],imageAltTexts:value.imageAltTexts.map(v=>v.trim())};
 for(const key of textKeys)out[key]=out[key].trim();
 return out;
}
export function verifySeoPersistence(submitted:SavedSeoSnapshot,loaded:SavedSeoSnapshot):{verified:boolean;differences:string[]}{
 const expected=normalizedSeo(submitted),actual=normalizedSeo(loaded);
 const keys:(keyof SavedSeoSnapshot)[]=["revision",...textKeys,"keywords","imageAltTexts","robotsIndex","robotsFollow","schemaEnabled"];
 const differences=keys.filter(key=>JSON.stringify(expected[key])!==JSON.stringify(actual[key]));
 return {verified:differences.length===0,differences};
}
