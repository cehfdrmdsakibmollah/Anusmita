import {z} from "zod";
import {isSafeLink} from "@/lib/home-content";

// Editorial-only links. Identity, search, cart, login, and legal controls are rendered separately.
export const chromeLinkSchema=z.object({
 id:z.string().regex(/^[a-z0-9-]{1,48}$/),
 label:z.string().trim().min(1).max(50),
 href:z.string().trim().max(250).refine(isSafeLink,"Internal links only")
}).strict();
export const chromeLinksSchema=z.array(chromeLinkSchema).max(12).refine(
 items=>new Set(items.map(x=>x.id)).size===items.length,"Link IDs must be unique"
);
export type ChromeLink=z.infer<typeof chromeLinkSchema>;
export const defaultNavLinks:ChromeLink[]=[
 {id:"home",label:"Home",href:"/"},{id:"shop",label:"Shop",href:"/shop"},
 {id:"bundles",label:"Bundles",href:"/bundles"},{id:"deals",label:"Deals",href:"/deals"},
 {id:"journal",label:"Journal",href:"/journal/design-preview"},
 {id:"contact",label:"Contact",href:"/contact/design-preview"}
];
export const defaultShopLinks:ChromeLink[]=[
 {id:"products",label:"All products",href:"/shop"},
 {id:"bedsheets",label:"Bed sheets",href:"/shop?category=Bed%20Sheets"},
 {id:"bundles",label:"Bundles & offers",href:"/bundles"},
 {id:"story",label:"Our story",href:"/about/design-preview"}
];
export const defaultCareLinks:ChromeLink[]=[
 {id:"tracking",label:"Track your order",href:"/track-order"},
 {id:"shipping",label:"Shipping & delivery",href:"/shipping/design-preview"},
 {id:"returns",label:"Returns & refunds",href:"/returns/design-preview"},
 {id:"contact",label:"Contact us",href:"/contact/design-preview"}
];
export function validatedLinks(value:unknown,fallback:ChromeLink[]):ChromeLink[]{
 if(value===undefined||value===null)return fallback.map(x=>({...x}));
 const parsed=chromeLinksSchema.safeParse(value);
 return parsed.success?parsed.data:fallback.map(x=>({...x}));
}
