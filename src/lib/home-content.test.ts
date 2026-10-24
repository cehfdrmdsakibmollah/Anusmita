
import {describe,it,expect} from "vitest";
import {blockSchema,homeStarterBlocks,homeStarterSections,cmsOperation,publicBlocks,isSafeImage,isSafeLink,uniqueSections} from "./home-content";
describe("ANUSMITA homepage CMS safety",()=>{
 it("has real categories with no fabricated products, pricing, stock or discounts",()=>{
  expect(homeStarterBlocks.filter(x=>x.kind==="category").map(x=>x.title)).toEqual(["Skincare","Beauty","Fashion","Watches","Mobile Accessories","Bed Sheets","Perfumes","Bags"]);
  expect(homeStarterBlocks.filter(x=>x.kind==="promotion")).toHaveLength(0);
  expect(homeStarterSections).toHaveLength(5);
  expect(uniqueSections(homeStarterSections)).toBe(true);
  expect(homeStarterBlocks.every(x=>blockSchema.safeParse(x).success)).toBe(true);
 });
 it("never renders drafts, expired or future-dated promotions",()=>{
  const base=homeStarterBlocks[0];
  const now=new Date("2026-10-24T08:00:00.000Z");
  const candidates=[
   {...base,id:"00000000-0000-4000-8000-000000000013",position:4,enabled:false},
   {...base,id:"00000000-0000-4000-8000-000000000014",position:2,startsAt:"2026-10-25T08:00:00.000Z"},
   {...base,id:"00000000-0000-4000-8000-000000000015",position:3,endsAt:"2026-10-23T08:00:00.000Z"},
   {...base,id:"00000000-0000-4000-8000-000000000016",position:1}
  ];
  expect(publicBlocks(candidates,now).map(x=>x.id)).toEqual(["00000000-0000-4000-8000-000000000016"]);
 });
 it("rejects foreign images, dangerous redirects and fake/malformed expiry",()=>{
  const b=homeStarterBlocks[0];
  expect(isSafeImage("javascript:alert(1)")).toBe(false);
  expect(isSafeImage("https://res.cloudinary.com.attacker.com/oseohmxd/image/upload/f.png")).toBe(false);
  expect(isSafeImage("https://images.unsplash.com/photo-test")).toBe(true);
  expect(isSafeLink("//evil.example")).toBe(false);
  expect(isSafeLink("/?category=Beauty#shop")).toBe(true);
  expect(blockSchema.safeParse({...b,href:"https://phishing.example"}).success).toBe(false);
  expect(blockSchema.safeParse({...b,startsAt:"2026-10-26T08:00:00.000Z",endsAt:"2026-10-25T08:00:00.000Z"}).success).toBe(false);
 });
 it("requires versioned operations and valid data",()=>{
  expect(cmsOperation.safeParse({action:"add",revision:0,block:homeStarterBlocks[0]}).success).toBe(true);
  expect(cmsOperation.safeParse({action:"delete",revision:0,id:homeStarterBlocks[0].id}).success).toBe(true);
  expect(cmsOperation.safeParse({action:"edit",revision:-1,block:homeStarterBlocks[0]}).success).toBe(false);
  expect(cmsOperation.safeParse({action:"reorder",revision:1,kind:"category",ids:[]}).success).toBe(false);
 });
});
