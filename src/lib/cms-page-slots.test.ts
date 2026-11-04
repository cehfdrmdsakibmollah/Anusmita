import {describe,it,expect} from "vitest";
import {cmsSaveSchema,cmsSlots} from "./cms-page-slots";
const valid={id:"550e8400-e29b-41d4-a716-446655440000",placement:"before" as const,title:"Autumn beauty edit",subtitle:"Shop selected items",badge:"NEW",imageUrl:"/brand/categories/skincare.webp",cta:"Shop",href:"/shop",enabled:true,position:0};
describe("Unified CMS Page Slots",()=>{
 it("accepts approved editorial content",()=>{expect(cmsSlots.safeParse([valid]).success).toBe(true);});
 it("rejects unsafe external media",()=>{expect(cmsSlots.safeParse([{...valid,imageUrl:"https://attacker.invalid/photo.jpg"}]).success).toBe(false);});
 it("rejects javascript links",()=>{expect(cmsSlots.safeParse([{...valid,href:"javascript:alert(1)"}]).success).toBe(false);});
 it("rejects duplicate block IDs",()=>{expect(cmsSlots.safeParse([valid,valid]).success).toBe(false);});
 it("supports draft and explicit publish but only known pages",()=>{expect(cmsSaveSchema.safeParse({action:"publish",page:"deals",revision:0,slots:[valid]}).success).toBe(true);expect(cmsSaveSchema.safeParse({action:"publish",page:"unknown-route",revision:0,slots:[valid]}).success).toBe(false);});
 it("supports per-page layout controls with safe style defaults",()=>{
  const result=cmsSlots.safeParse([valid]);
  expect(result.success).toBe(true);
  if(result.success){
   expect(result.data[0].kind).toBe("banner");
   expect(result.data[0].style.background).toBe("#fff0f5");
  }
  const modern={...valid,kind:"hero",style:{background:"#fff4f7",textColor:"#661b39",accentColor:"#8b1642",fontSize:44,padding:48,radius:16,alignment:"center",imagePosition:"left"}};
  expect(cmsSlots.safeParse([modern]).success).toBe(true);
  expect(cmsSlots.safeParse([{...modern,style:{...modern.style,background:"url(javascript:evil)"}}]).success).toBe(false);
  expect(cmsSlots.safeParse([{...modern,style:{...modern.style,padding:100000}}]).success).toBe(false);
  expect(cmsSlots.safeParse([{...modern,style:{...modern.style,customCss:"body{display:none}"}}]).success).toBe(false);
 });
 it("allows CMS editorial blocks on other supported routes while preserving native logic",()=>{
  for(const p of ["shop","deals","bundles","about","contact","journal","cart","checkout","gift-cards","pre-orders","customer-stories","wishlist","routine-quiz","track-order"]){
   expect(cmsSaveSchema.safeParse({action:"publish",page:p,revision:0,slots:[valid]}).success).toBe(true);
  }
 });
 it("allows isolated uploaded CMS R2 media without allowing arbitrary URLs",()=>{
  const asset="https://anusmita-media.mdsakibmolla545.workers.dev/public/cms/bundles/550e8400-e29b-41d4-a716-446655440000.webp";
  expect(cmsSlots.safeParse([{...valid,imageUrl:asset}]).success).toBe(true);
  expect(cmsSlots.safeParse([{...valid,imageUrl:asset+"?tracker=1"}]).success).toBe(false);
  expect(cmsSlots.safeParse([{...valid,imageUrl:asset.replace("cms/bundles","products/bundles")}]).success).toBe(false);
 });
 it("supports independently published native hero settings and protects image sources",()=>{
  const payload={action:"publish",page:"bundles",revision:4,slots:[valid],nativeHero:{title:"New Bundle Collection",subtitle:"Shop real curated sets.",imageUrl:"/brand/hero-reference.webp",background:"#fff4f7",textColor:"#74143e"}};
  expect(cmsSaveSchema.safeParse(payload).success).toBe(true);
  expect(cmsSaveSchema.safeParse({...payload,nativeHero:{...payload.nativeHero,imageUrl:"https://untrusted.example/hero.png"}}).success).toBe(false);
  expect(cmsSaveSchema.safeParse({...payload,nativeHero:{...payload.nativeHero,background:"url(javascript:bad)"}}).success).toBe(false);
 });
 it("rejects unknown properties",()=>{expect(cmsSlots.safeParse([{...valid,html:"<script />"}]).success).toBe(false);});
});
