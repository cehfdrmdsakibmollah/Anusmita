
export const perfumeSizes=[
 {ml:2,label:"2ml Spray"},
 {ml:5,label:"5ml"},
 {ml:10,label:"10ml"},
 {ml:15,label:"15ml"},
 {ml:50,label:"50ml"},
 {ml:100,label:"100ml"}
] as const;

export type PerfumeSku={
 name:string;brand:string;category:string;size?:string;variantLabel?:string;
 slug:string;pricePaisa:number;onHand:number;reserved:number;
};
export type PerfumeVariant={ml:number;label:string;slug:string|null;pricePaisa:number|null;available:number|null;selected:boolean};

export function isPerfumeProduct(p:{name:string;category:string}):boolean{
 return /perfume|fragrance|eau de|parfum|cologne|attar|edp|edt/i.test(p.category+" "+p.name);
}
export function perfumeMl(p:Pick<PerfumeSku,"name"|"size"|"variantLabel">):number|null{
 for(const value of [p.size,p.variantLabel,p.name].filter(Boolean)){
  const match=String(value).match(/(?:^|[\s(\/-])(2|5|10|15|50|100)\s*ml\b/i);
  if(match)return Number(match[1]);
 }
 return null;
}
/**
 * Only variants of the same explicitly named perfume belong in one selector.
 * Removing size from the *end* avoids joining names with similar prefixes.
 */
export function perfumeFamily(name:string):string{
 return name.replace(/\s*[\(\[]?\s*(?:2|5|10|15|50|100)\s*ml\b\s*(?:spray|decant|atomizer|travel|bottle)?\s*[\)\]]?\s*$/i,"")
  .replace(/\s*[-–|]\s*$/,"").trim().replace(/\s+/g," ").toLocaleLowerCase("en");
}
export function perfumeVariantOptions(current:PerfumeSku,candidates:PerfumeSku[]):PerfumeVariant[]{
 const family=perfumeFamily(current.name);
 const same=[current,...candidates].filter(p=>
  p.category.toLowerCase().trim()===current.category.toLowerCase().trim()&&
  p.brand.toLowerCase().trim()===current.brand.toLowerCase().trim()&&
  perfumeFamily(p.name)===family
 );
 const byMl=new Map<number,PerfumeSku>();
 for(const p of same){
  const ml=perfumeMl(p);
  if(ml===null)continue;
  const existing=byMl.get(ml);
  if(!existing||p.slug===current.slug)byMl.set(ml,p);
 }
 return perfumeSizes.map(size=>{
  const matched=byMl.get(size.ml);
  return {ml:size.ml,label:size.label,slug:matched?.slug??null,
   pricePaisa:matched?.pricePaisa??null,
   available:matched?Math.max(0,matched.onHand-matched.reserved):null,
   selected:matched?.slug===current.slug};
 });
}
