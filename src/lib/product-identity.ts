import {z} from "zod";
export const productIdentityQuery=z.object({
 sku:z.string().trim().regex(/^[A-Za-z0-9_-]{3,60}$/),
 slug:z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200)
}).strict();
export function nextProductIdentity(base:string,used:(candidate:string)=>boolean,max=60){
 const normalized=base.slice(0,max);
 for(let index=2;index<=100;index++){
  const suffix="-"+index;
  const candidate=normalized.slice(0,max-suffix.length)+suffix;
  if(!used(candidate))return candidate;
 }
 return null;
}
export function duplicateProductIdentityField(error:unknown):"sku"|"slug"|null{
 if(!error||typeof error!=="object")return null;
 const entry=error as {code?:number;keyPattern?:Record<string,unknown>;keyValue?:Record<string,unknown>};
 if(entry.code!==11000)return null;
 if(entry.keyPattern?.sku!==undefined||entry.keyValue?.sku!==undefined)return "sku";
 if(entry.keyPattern?.slug!==undefined||entry.keyValue?.slug!==undefined)return "slug";
 return null;
}
