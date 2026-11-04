import {z} from "zod";
import {isSafeImage,isSafeLink} from "@/lib/home-content";
export const cmsSlotPages=["shop","deals","bundles","about","contact","journal","cart","checkout","gift-cards","pre-orders","customer-stories","wishlist","routine-quiz","track-order"] as const;
export const cmsSectionKinds=["hero","banner","text","image","callout","split"] as const;
export const cmsSectionAlignments=["left","center","right"] as const;
export const cmsSectionImagePositions=["left","right","background"] as const;
export const cmsStyleSchema=z.object({
 background:z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#fff0f5"),
 textColor:z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#641a36"),
 accentColor:z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#8a113f"),
 fontSize:z.number().int().min(18).max(64).default(34),
 padding:z.number().int().min(0).max(100).default(28),
 radius:z.number().int().min(0).max(48).default(14),
 alignment:z.enum(cmsSectionAlignments).default("left"),
 imagePosition:z.enum(cmsSectionImagePositions).default("right")
}).strict();
export type CmsStyle=z.infer<typeof cmsStyleSchema>;
export const defaultCmsStyle:CmsStyle=cmsStyleSchema.parse({});
export const cmsSlotSchema=z.object({
 id:z.uuid(),placement:z.enum(["before","after"]),
 kind:z.enum(cmsSectionKinds).default("banner"),
 style:cmsStyleSchema.default(defaultCmsStyle),
 title:z.string().trim().min(2).max(110),
 subtitle:z.string().trim().max(400).default(""),
 badge:z.string().trim().max(60).default(""),
 imageUrl:z.string().trim().max(500).default(""),
 cta:z.string().trim().max(48).default(""),
 href:z.string().trim().max(250).default("/shop"),
 enabled:z.boolean().default(true),
 position:z.number().int().min(0).max(99)
}).strict().superRefine((slot,ctx)=>{
 if(slot.imageUrl&&!isSafeImage(slot.imageUrl))ctx.addIssue({code:"custom",path:["imageUrl"],message:"Only approved HTTPS Cloudinary, Unsplash or brand assets are allowed"});
 if(!isSafeLink(slot.href))ctx.addIssue({code:"custom",path:["href"],message:"Use an internal /path or #anchor link"});
});
export const cmsSlots=z.array(cmsSlotSchema).max(20).refine(items=>new Set(items.map(x=>x.id)).size===items.length,"Duplicate block IDs");
export const cmsSaveSchema=z.object({page:z.enum(cmsSlotPages),revision:z.number().int().min(0),action:z.enum(["saveDraft","publish"]),slots:cmsSlots}).strict();
export type CmsSlot=z.infer<typeof cmsSlotSchema>;
export type CmsSlotPage=typeof cmsSlotPages[number];
