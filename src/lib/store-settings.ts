import {z} from "zod";
export const storeSettings=z.object({
 revision:z.number().int().nonnegative(),
 storeName:z.string().trim().min(2).max(80),
 supportEmail:z.union([z.email(),z.literal("")]),
 supportPhone:z.string().max(25).regex(/^[+0-9 ()-]*$/),
 currency:z.literal("BDT"),
 timezone:z.literal("Asia/Dhaka"),
 minimumOrderPaisa:z.number().int().min(0).max(100000000),
 maximumCodPaisa:z.number().int().min(0).max(100000000),
 dhakaShippingPaisa:z.number().int().min(0).max(10000000),
 outsideShippingPaisa:z.number().int().min(0).max(10000000)
}).strict().refine(value=>!value.maximumCodPaisa||value.maximumCodPaisa>=value.minimumOrderPaisa,"COD maximum must cover the minimum order");
export type StoreSettingsData=z.infer<typeof storeSettings>;
export function defaultStoreSettings(env:Record<string,string|undefined>):StoreSettingsData{
 const fee=(value:string|undefined,fallback:number)=>{const number=Number(value??fallback);return Number.isSafeInteger(number)&&number>=0&&number<=10000000?number:fallback;};
 return {revision:0,storeName:"ANUSMITA",supportEmail:"",supportPhone:"",currency:"BDT",timezone:"Asia/Dhaka",minimumOrderPaisa:0,maximumCodPaisa:0,
 dhakaShippingPaisa:fee(env.SHIPPING_DHAKA_PAISA,7000),outsideShippingPaisa:fee(env.SHIPPING_OTHER_PAISA,12000)};
}
