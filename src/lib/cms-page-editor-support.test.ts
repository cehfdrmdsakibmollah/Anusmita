import {describe,it,expect} from "vitest";
import {cmsNativeHeroSchema,defaultCmsNativeHero,cmsSlotPages} from "./cms-page-slots";
import {hasNativePageHero,hasCmsPageIntro,shouldRenderCmsIntro,sameCmsPageDraft,additionalIntroPageNames} from "./cms-page-editor-support";
describe("Universal CMS page editing and publishing safety",()=>{
 it("offers a visual intro editor for all nine previously unsupported routes",()=>{
  for(const page of additionalIntroPageNames){
   expect(hasCmsPageIntro(page)).toBe(true);
   expect(hasNativePageHero(page)).toBe(false);
  }
  expect(cmsSlotPages.length).toBe(14);
 });
 it("never overlays existing independently configured native page heroes",()=>{
  for(const name of ["deals","bundles","about","contact","journal"] as const){
   expect(hasNativePageHero(name)).toBe(true);
   expect(hasCmsPageIntro(name)).toBe(false);
   expect(shouldRenderCmsIntro(name,{title:"Sample"})).toBe(false);
  }
 });
 it("renders only valid, nonempty published intros",()=>{
  expect(shouldRenderCmsIntro("shop",{title:"Curated Shop"})).toBe(true);
  expect(shouldRenderCmsIntro("cart",{subtitle:"Your selected items"})).toBe(true);
  expect(shouldRenderCmsIntro("wishlist",{imageUrl:"/brand/hero-reference.webp"})).toBe(true);
  expect(shouldRenderCmsIntro("cart",{})).toBe(false);
  expect(shouldRenderCmsIntro("cart",{title:"Unsafe",imageUrl:"javascript:alert(1)"})).toBe(false);
 });
 it("verifies persisted CMS content and revision independently",()=>{
  const draft={revision:2,draft:[],nativeDraft:cmsNativeHeroSchema.parse({title:"My Shop"})};
  expect(sameCmsPageDraft(draft,{...draft,nativeDraft:{...defaultCmsNativeHero,title:"My Shop"}})).toBe(true);
  expect(sameCmsPageDraft(draft,{...draft,revision:3})).toBe(false);
  expect(sameCmsPageDraft(draft,{...draft,nativeDraft:{...defaultCmsNativeHero,title:"Different"}})).toBe(false);
 });
});
