export const nativePromoIds={
 deals:["serum","cleanser","perfume","tote","lipstick","watch","bedding","dress"],
 bundles:["routine","duo","beauty","fragrance"]
} as const;
export type NativePromoPage=keyof typeof nativePromoIds;
export function validateNativePromoIds(page:string,cards:readonly {id:string}[]):boolean{
 if(page!=="deals"&&page!=="bundles")return cards.length===0;
 const allowed=new Set<string>(nativePromoIds[page]);
 return cards.every(x=>allowed.has(x.id))&&new Set(cards.map(x=>x.id)).size===cards.length;
}
