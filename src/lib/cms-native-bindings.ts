import {z} from "zod";
import {cmsSlotPages,type CmsSlotPage} from "@/lib/cms-page-slots";
export const cmsNativeKeys=["eyebrow","promoHeading","promoDescription","helpHeading","formHeading","footerNote"] as const;
export type CmsNativeKey=typeof cmsNativeKeys[number];
/** Only approved editorial text nodes are bound. Never target an input value, price, SKU, operational status, CTA URL, or checkout action. */
export const nativeTextTargets:Record<CmsSlotPage,Partial<Record<CmsNativeKey,string>>>={
 shop:{eyebrow:".anShopHero span",promoHeading:".anShopHeading h2"},
 deals:{promoHeading:".dp-editorial h2",promoDescription:".dp-editorial p",helpHeading:".dp-help h3",footerNote:".dp-preview-note"},
 bundles:{promoHeading:".bp-feature-copy h3",promoDescription:".bp-feature-copy .bp-eyebrow",footerNote:".bp-preview-note"},
 about:{promoHeading:".ip-care h2",promoDescription:".ip-care p",helpHeading:".ip-cta h2"},
 contact:{promoHeading:".ip-contact-hero h1",formHeading:".ip-form-card h2"},
 journal:{promoHeading:".ip-journal-hero h1"},
 cart:{eyebrow:".anFlowHero small",promoDescription:".anFlowHero p"},
 checkout:{promoDescription:".anFlowCheckoutIntro p"},
 "gift-cards":{eyebrow:".gc-eyebrow",footerNote:".gc-preview-note"},
 "pre-orders":{eyebrow:".po-eyebrow",promoDescription:".po-journey .po-estimate"},
 "customer-stories":{eyebrow:".cs-eyebrow",footerNote:".cs-preview-note"},
 wishlist:{promoDescription:".sheetEmpty p"},
 "routine-quiz":{eyebrow:".rq-pill",promoDescription:".rq-help p"},
 "track-order":{eyebrow:".to-eyebrow",promoDescription:".to-form-panel>p"}
};
export const cmsNativeTextEntrySchema=z.object({
 key:z.enum(cmsNativeKeys),
 text:z.string().trim().min(1).max(240),
 enabled:z.boolean().default(true)
}).strict();
export const cmsNativeTextSchema=z.array(cmsNativeTextEntrySchema).max(6).refine(a=>new Set(a.map(x=>x.key)).size===a.length,"Duplicate native text bindings");
export type CmsNativeTextEntry=z.infer<typeof cmsNativeTextEntrySchema>;
export function validatePageNativeText(page:CmsSlotPage,items:readonly CmsNativeTextEntry[]):boolean{
 return items.every(x=>!!nativeTextTargets[page][x.key]);
}
export const nativeBindingPageCount=cmsSlotPages.length;
