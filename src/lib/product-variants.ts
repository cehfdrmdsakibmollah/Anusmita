
/** Published products use independent SKU/stock/price per size. Never infer prices. */
export const PERFUME_SIZES=[
 {key:"2ml spray",label:"2ml Spray"},
 {key:"5ml",label:"5ml"},
 {key:"10ml",label:"10ml"},
 {key:"15ml",label:"15ml"},
 {key:"50ml",label:"50ml"},
 {key:"100ml",label:"100ml"}
] as const;
export function isPerfumeCategory(category:string){
 return /perfume|fragrance|attar|scent|decant/i.test(category);
}
export function canonicalPerfumeSize(value:string){
 const text=value.toLowerCase().trim().replace(/\s+/g," ");
 const found=text.match(/^(\d+(?:\.\d+)?)\s*(ml|millilit(?:er|re)s?)(?:\s*[-–]?\s*(spray|decant|bottle|edp|edt))?$/);
 if(!found)return null;
 const n=Number(found[1]);
 return PERFUME_SIZES.find(s=>Number(s.key.match(/^\d+/)?.[0])===n)?.key||null;
}
export type ProductVariant={
 id:string;slug:string;size:string;pricePaisa:number;available:number;sku:string;color?:string;colorHex?:string
};
export function perfumeSizeCards(variants:ProductVariant[],current:ProductVariant){
 const all=[current,...variants];
 return PERFUME_SIZES.map(size=>{
  const sku=all.find(v=>canonicalPerfumeSize(v.size)===size.key);
  return {key:size.key,label:size.label,slug:sku?.slug||null,pricePaisa:sku?.pricePaisa??null,
   available:sku?.available??null,selected:sku?.id===current.id,sku:sku?.sku||null};
 });
}
export function shouldListGroup(group?:string){
 return Boolean(group&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(group)&&group.length<=100);
}

export function colourChoices(variants:ProductVariant[],current:ProductVariant){
 const all=[current,...variants];return [...new Set(all.map(v=>v.color||'').filter(Boolean))].map(color=>{
 const matching=all.filter(v=>v.color===color);const target=matching.find(v=>v.size===current.size)||matching[0];return {color,hex:target.colorHex||'',slug:target.slug,selected:color===current.color};
 });
}
/** Render a size picker only when another published SKU offers a distinct size in the selected colour. */
export function sizeChoices(variants:ProductVariant[],current:ProductVariant){
 const choices=[current,...variants].filter(v=>(v.color||'')===(current.color||''));
 return new Set(choices.map(v=>v.size.trim().toLowerCase())).size>1?choices:[];
}
