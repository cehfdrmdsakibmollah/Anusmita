import {describe,it,expect} from "vitest";
import {cmsSaveSchema,cmsSlots,cmsRestoreSchema,cmsRevisionSchema} from "./cms-page-slots";
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
 it("accepts page-scoped R2 hero replacement and resetting to original without affecting native features",()=>{
  const asset="https://anusmita-media.mdsakibmolla545.workers.dev/public/cms/deals/550e8400-e29b-41d4-a716-446655440000.webp";
  const hero={title:"New deals",subtitle:"Current collection",imageUrl:asset,background:"#fff6f9",textColor:"#611b37"};
  const payload={action:"publish",page:"deals",revision:1,slots:[],nativeHero:hero};
  expect(cmsSaveSchema.safeParse(payload).success).toBe(true);
  expect(cmsSaveSchema.safeParse({...payload,nativeHero:{...hero,imageUrl:""}}).success).toBe(true);
  expect(cmsSaveSchema.safeParse({...payload,nativeHero:{...hero,imageUrl:asset.replace("/deals/","/products/")}}).success).toBe(false);
 });
 it("supports native section heading drafts without altering interactive commerce components",()=>{
  const sample={action:"publish",page:"bundles",revision:4,slots:[],nativeHero:{title:"",subtitle:"",sectionTitle:"Korean skincare sets",secondaryTitle:"Curated combinations",imageUrl:"",background:"#fff6f9",textColor:"#611b37"}};
  expect(cmsSaveSchema.safeParse(sample).success).toBe(true);
  expect(cmsSaveSchema.safeParse({...sample,nativeHero:{...sample.nativeHero,sectionTitle:""}}).success).toBe(true);
  expect(cmsSaveSchema.safeParse({...sample,nativeHero:{...sample.nativeHero,sectionTitle:"A".repeat(131)}}).success).toBe(false);
  expect(cmsSaveSchema.safeParse({...sample,nativeHero:{...sample.nativeHero,secondaryTitle:"B".repeat(131)}}).success).toBe(false);
  expect(cmsSaveSchema.safeParse({...sample,nativeHero:{...sample.nativeHero,html:"<script>alert(1)</script>"}}).success).toBe(false);
  expect(cmsSaveSchema.safeParse({action:"saveDraft",page:"deals",revision:0,slots:[],nativeHero:{}}).success).toBe(true);
 });
 it("validates restore-as-draft with CAS revision and a retained target",()=>{
  expect(cmsRestoreSchema.safeParse({action:"restoreDraft",page:"deals",revision:4,restoreRevision:2}).success).toBe(true);
  expect(cmsRestoreSchema.safeParse({action:"restoreDraft",page:"deals",revision:4,restoreRevision:0}).success).toBe(false);
  expect(cmsRestoreSchema.safeParse({action:"restoreDraft",page:"checkout",revision:-1,restoreRevision:2}).success).toBe(false);
  expect(cmsRestoreSchema.safeParse({action:"restoreDraft",page:"bad-route",revision:4,restoreRevision:2}).success).toBe(false);
  expect(cmsRestoreSchema.safeParse({action:"restoreDraft",page:"deals",revision:4,restoreRevision:2,published:true}).success).toBe(false);
 });
 it("validates saved revision snapshots against the same CMS schemas",()=>{
  const snapshot={revision:2,action:"saveDraft",createdAt:new Date(),slots:[valid],nativeHero:{title:"",subtitle:"",imageUrl:"",background:"#fff6f9",textColor:"#611b37"}};
  expect(cmsRevisionSchema.safeParse(snapshot).success).toBe(true);
  expect(cmsRevisionSchema.safeParse({...snapshot,slots:[{...valid,imageUrl:"javascript:alert(1)"}]}).success).toBe(false);
  expect(cmsRevisionSchema.safeParse({...snapshot,revision:0}).success).toBe(false);
 });
 it("validates nested editorial grid card CRUD without unsafe links or images",()=>{
  const a={id:"11111111-1111-4111-8111-111111111111",title:"New skincare edit",subtitle:"Explore our collection",imageUrl:"/brand/categories/skincare.webp",cta:"Browse",href:"/shop"};
  const b={...a,id:"22222222-2222-4222-8222-222222222222",title:"Beauty essentials"};
  const grid={...valid,kind:"grid",children:[a,b]};
  expect(cmsSlots.safeParse([grid]).success).toBe(true);
  expect(cmsSaveSchema.safeParse({action:"publish",page:"deals",revision:0,slots:[grid]}).success).toBe(true);
  expect(cmsSlots.safeParse([{...grid,children:[a,a]}]).success).toBe(false);
  expect(cmsSlots.safeParse([{...grid,children:Array.from({length:7},(_,i)=>({...a,id:"00000000-0000-4000-8000-"+String(i+1).padStart(12,"0")}))}]).success).toBe(false);
  expect(cmsSlots.safeParse([{...grid,children:[{...a,href:"javascript:alert(1)"}]}]).success).toBe(false);
  expect(cmsSlots.safeParse([{...grid,children:[{...a,imageUrl:"https://untrusted.invalid/image.jpg"}]}]).success).toBe(false);
  expect(cmsSlots.safeParse([{...grid,kind:"banner"}]).success).toBe(false);
  expect(cmsSlots.safeParse([{...grid,children:[]}]).success).toBe(true);
  expect(cmsSlots.safeParse([valid]).success).toBe(true);
 });
 it("rejects unknown properties",()=>{expect(cmsSlots.safeParse([{...valid,html:"<script />"}]).success).toBe(false);});
});
