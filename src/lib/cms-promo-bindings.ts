export const nativePromoIds={
 deals:["serum","cleanser","perfume","tote","lipstick","watch","bedding","dress"],
 bundles:["routine","duo","beauty","fragrance"]
} as const;
export const nativePromoLabels:Record<string,string>={
 serum:"Hydrating Serum",cleanser:"Gentle Cleanser",perfume:"Rose Eau de Parfum",tote:"Everyday Tote",
 lipstick:"Velvet Lip Colour",watch:"Classic Watch",bedding:"Cotton Bed Set",dress:"Summer Dress",
 routine:"Korean Skincare Routine",duo:"Cleanse & Hydrate Duo",beauty:"Everyday Beauty Trio",fragrance:"The Fragrance Pair"
};
export type NativePromoPage=keyof typeof nativePromoIds;
export function validateNativePromoIds(page:string,cards:readonly {id:string}[]):boolean{
 if(page!=="deals"&&page!=="bundles")return cards.length===0;
 const allowed=new Set<string>(nativePromoIds[page]);
 return cards.every(x=>allowed.has(x.id))&&new Set(cards.map(x=>x.id)).size===cards.length;
}
