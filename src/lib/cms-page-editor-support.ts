import {cmsNativeHeroSchema,type CmsNativeHero,type CmsSlotPage} from "./cms-page-slots";

export const nativeHeroPageNames=["shop","deals","bundles","about","contact","journal","cart","checkout","gift-cards","pre-orders","customer-stories","wishlist","routine-quiz","track-order"] as const;
export const additionalIntroPageNames=[] as const;
export function hasNativePageHero(page:CmsSlotPage):boolean{
 return nativeHeroPageNames.some(name=>name===page);
}
export function hasCmsPageIntro(page:CmsSlotPage):boolean{
 return additionalIntroPageNames.some(name=>name===page);
}
export function shouldRenderCmsIntro(page:CmsSlotPage,value:unknown):value is CmsNativeHero{
 if(!hasCmsPageIntro(page))return false;
 const parsed=cmsNativeHeroSchema.safeParse(value);
 if(!parsed.success)return false;
 return Boolean(parsed.data.title||parsed.data.subtitle||parsed.data.imageUrl);
}
export function sameCmsPageDraft(a:{draft:unknown;nativeDraft:unknown;revision:number},b:{draft:unknown;nativeDraft:unknown;revision:number}):boolean{
 return a.revision===b.revision&&JSON.stringify(a.draft)===JSON.stringify(b.draft)&&JSON.stringify(cmsNativeHeroSchema.parse(a.nativeDraft||{}))===JSON.stringify(cmsNativeHeroSchema.parse(b.nativeDraft||{}));
}
