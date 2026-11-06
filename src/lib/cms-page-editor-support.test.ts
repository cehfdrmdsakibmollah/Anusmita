import {describe,it,expect} from "vitest";
import {cmsNativeHeroSchema,defaultCmsNativeHero,cmsSlotPages} from "./cms-page-slots";
import {hasNativePageHero,hasCmsPageIntro,shouldRenderCmsIntro,sameCmsPageDraft,additionalIntroPageNames} from "./cms-page-editor-support";
describe("Universal CMS page editing and publishing safety",()=>{
 it("supports real native page content bindings on all 14 storefront routes",()=>{
  expect(cmsSlotPages.length).toBe(14);
  for(const page of cmsSlotPages){
   expect(hasNativePageHero(page)).toBe(true);
   expect(hasCmsPageIntro(page)).toBe(false);
  }
  expect(additionalIntroPageNames).toHaveLength(0);
 });
 it("does not duplicate page-intro markup over native heroes",()=>{
  for(const page of cmsSlotPages){
   expect(shouldRenderCmsIntro(page,{title:"Custom page title"})).toBe(false);
  }
 });
 it("rejects unsafe native images before applying overrides",()=>{
  expect(cmsNativeHeroSchema.safeParse({title:"ANUSMITA",imageUrl:"javascript:alert(1)"}).success).toBe(false);
  expect(cmsNativeHeroSchema.safeParse({title:"ANUSMITA",imageUrl:"/brand/hero-reference.webp"}).success).toBe(true);
 });
 it("verifies persisted CMS content and revision independently",()=>{
  const draft={revision:2,draft:[],nativeDraft:cmsNativeHeroSchema.parse({title:"My Shop"})};
  expect(sameCmsPageDraft(draft,{...draft,nativeDraft:{...defaultCmsNativeHero,title:"My Shop"}})).toBe(true);
  expect(sameCmsPageDraft(draft,{...draft,revision:3})).toBe(false);
  expect(sameCmsPageDraft(draft,{...draft,nativeDraft:{...defaultCmsNativeHero,title:"Different"}})).toBe(false);
 });
});
