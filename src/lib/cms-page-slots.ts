import {z} from "zod";
import {isSafeImage,isSafeLink} from "@/lib/home-content";
import {cmsCssRulesSchema} from "@/lib/cms-css-rules";
import {cmsNativeTextSchema} from "@/lib/cms-native-bindings";
export const cmsSlotPages=["shop","deals","bundles","about","contact","journal","cart","checkout","gift-cards","pre-orders","customer-stories","wishlist","routine-quiz","track-order"] as const;
export const cmsSectionKinds=["hero","banner","text","image","callout","split","grid"] as const;
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
export function isSafeCmsImage(url:string){
 if(isSafeImage(url))return true;
 try{
  const u=new URL(url);
  return u.protocol==="https:"&&u.hostname==="anusmita-media.mdsakibmolla545.workers.dev"&&
    !u.username&&!u.password&&!u.search&&!u.hash&&
    /^\/public\/cms\/(?:shop|deals|bundles|about|contact|journal|cart|checkout|gift-cards|pre-orders|customer-stories|wishlist|routine-quiz|track-order)\/[0-9a-fA-F-]{36}\.(?:jpg|png|webp)$/.test(u.pathname);
 }catch{return false;}
}
export const cmsNativeHeroSchema=z.object({
 title:z.string().trim().max(130).default(""),
 subtitle:z.string().trim().max(320).default(""),
 sectionTitle:z.string().trim().max(130).default(""),
 sectionImageUrl:z.string().trim().max(500).default(""),
 secondaryTitle:z.string().trim().max(130).default(""),
 imageUrl:z.string().trim().max(500).default(""),
 background:z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#fff6f9"),
 textColor:z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#611b37"),
 cssRules:cmsCssRulesSchema.default([]),
 textBindings:cmsNativeTextSchema.default([])
}).strict().superRefine((hero,ctx)=>{
 if(hero.imageUrl&&!isSafeCmsImage(hero.imageUrl))ctx.addIssue({code:"custom",path:["imageUrl"],message:"Hero image must be an approved media URL"});
 if(hero.sectionImageUrl&&!isSafeCmsImage(hero.sectionImageUrl))ctx.addIssue({code:"custom",path:["sectionImageUrl"],message:"Native section image must be approved"});
});
export type CmsNativeHero=z.infer<typeof cmsNativeHeroSchema>;
export const defaultCmsNativeHero:CmsNativeHero=cmsNativeHeroSchema.parse({});
export const cmsNestedLeafSchema=z.object({
 id:z.uuid(),title:z.string().trim().min(1).max(100),
 subtitle:z.string().trim().max(240).default(""),
 imageUrl:z.string().trim().max(500).default(""),
 cta:z.string().trim().max(40).default(""),
 href:z.string().trim().max(250).default("/shop")
}).strict().superRefine((item,ctx)=>{
 if(item.imageUrl&&!isSafeCmsImage(item.imageUrl))ctx.addIssue({code:"custom",path:["imageUrl"],message:"Only approved media assets"});
 if(!isSafeLink(item.href))ctx.addIssue({code:"custom",path:["href"],message:"Safe internal link required"});
});
export const cmsNestedCardSchema=z.object({
 id:z.uuid(),
 subcards:z.array(cmsNestedLeafSchema).max(4).refine(items=>new Set(items.map(x=>x.id)).size===items.length,"Duplicate nested leaf IDs").default([]),
 title:z.string().trim().min(2).max(100),
 subtitle:z.string().trim().max(240).default(""),
 imageUrl:z.string().trim().max(500).default(""),
 cta:z.string().trim().max(40).default(""),
 href:z.string().trim().max(250).default("/shop")
}).strict().superRefine((card,ctx)=>{
 if(card.imageUrl&&!isSafeCmsImage(card.imageUrl))ctx.addIssue({code:"custom",path:["imageUrl"],message:"Only approved media assets are supported"});
 if(!isSafeLink(card.href))ctx.addIssue({code:"custom",path:["href"],message:"Use a safe internal link"});
});
export type CmsNestedCard=z.infer<typeof cmsNestedCardSchema>;
export const cmsSlotSchema=z.object({
 id:z.uuid(),placement:z.enum(["before","after"]),
 kind:z.enum(cmsSectionKinds).default("banner"),
 style:cmsStyleSchema.default(defaultCmsStyle),
 cssRules:cmsCssRulesSchema.default([]),
 title:z.string().trim().min(2).max(110),
 subtitle:z.string().trim().max(400).default(""),
 badge:z.string().trim().max(60).default(""),
 imageUrl:z.string().trim().max(500).default(""),
 children:z.array(cmsNestedCardSchema).max(6).refine(items=>new Set(items.map(x=>x.id)).size===items.length,"Duplicate nested card IDs").default([]),
 cta:z.string().trim().max(48).default(""),
 href:z.string().trim().max(250).default("/shop"),
 enabled:z.boolean().default(true),
 position:z.number().int().min(0).max(99)
}).strict().superRefine((slot,ctx)=>{
 if(slot.imageUrl&&!isSafeCmsImage(slot.imageUrl))ctx.addIssue({code:"custom",path:["imageUrl"],message:"Only approved HTTPS Cloudinary, Unsplash or brand assets are allowed"});
 if(!isSafeLink(slot.href))ctx.addIssue({code:"custom",path:["href"],message:"Use an internal /path or #anchor link"});
 if(slot.kind!=="grid"&&slot.children.length)ctx.addIssue({code:"custom",path:["children"],message:"Nested cards are supported on grid sections only"});
});
export const cmsSlots=z.array(cmsSlotSchema).max(20).refine(items=>new Set(items.map(x=>x.id)).size===items.length,"Duplicate block IDs");
export const cmsSaveSchema=z.object({page:z.enum(cmsSlotPages),revision:z.number().int().min(0),action:z.enum(["saveDraft","publish"]),slots:cmsSlots,nativeHero:cmsNativeHeroSchema.default(defaultCmsNativeHero)}).strict();
export const cmsRestoreSchema=z.object({page:z.enum(cmsSlotPages),revision:z.number().int().min(0),action:z.literal("restoreDraft"),restoreRevision:z.number().int().min(1)}).strict();
export const cmsRevisionSchema=z.object({revision:z.number().int().min(1),action:z.enum(["saveDraft","publish","restoreDraft"]),createdAt:z.coerce.date(),slots:cmsSlots,nativeHero:cmsNativeHeroSchema});
export type CmsRevision=z.infer<typeof cmsRevisionSchema>;
export type CmsSlot=z.infer<typeof cmsSlotSchema>;
export type CmsSlotPage=typeof cmsSlotPages[number];
