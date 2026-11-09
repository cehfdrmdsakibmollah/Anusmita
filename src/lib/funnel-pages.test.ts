import {describe,it,expect} from "vitest";
import {funnelWrite,funnelContent,safeFunnelStyle,safeFunnelUrl,initialFunnelBlock} from "./funnel-pages";
const base=()=>({slug:"beauty-serum",revision:0,mode:"draft",content:{title:"Beauty Serum Landing Page",description:"Limited offer",seoTitle:"Beauty Serum",noIndex:false,blocks:[initialFunnelBlock("hero")]}});
describe("secure ANUSMITA funnel campaign contracts",()=>{
 it("validates a structured, editable campaign",()=>{
  expect(funnelWrite.safeParse(base()).success).toBe(true);
  expect(funnelContent.safeParse(base().content).success).toBe(true);
 });
 it("blocks unknown script-like properties and forged publishing flags",()=>{
  expect(funnelWrite.safeParse({...base(),content:{...base().content,blocks:[{...initialFunnelBlock("hero"),script:"alert(1)"}]}}).success).toBe(false);
  expect(funnelWrite.safeParse({...base(),dbName:"anusmita_shop"}).success).toBe(false);
 });
 it("rejects duplicated element IDs, unsafe CSS injection and malformed slugs",()=>{
  const block=initialFunnelBlock("hero");
  expect(funnelWrite.safeParse({...base(),content:{...base().content,blocks:[block,block]}}).success).toBe(false);
  expect(funnelWrite.safeParse({...base(),slug:"../admin"}).success).toBe(false);
  expect(safeFunnelStyle({backgroundColor:"red;position:fixed",padding:"10px; transform:scale(5)",width:"100%"})).toEqual({width:"100%"});
 });
 it("sanitizes typography, borders and effects while preserving valid controls",()=>{
  expect(safeFunnelStyle({fontFamily:"Georgia",lineHeight:"1.2",letterSpacing:"-0.5px",borderWidth:"2px",borderStyle:"solid",borderColor:"#5a0f2e",opacity:"0.75"})).toMatchObject({
   fontFamily:"Georgia",lineHeight:"1.2",letterSpacing:"-0.5px",borderWidth:"2px",borderStyle:"solid",borderColor:"#5a0f2e",opacity:0.75
  });
  expect(safeFunnelStyle({letterSpacing:"0px;position:fixed",lineHeight:"expression(alert(1))",opacity:"2"})).toEqual({});
 });
  it("blocks javascript/data link schemes",()=>{
  expect(safeFunnelUrl("javascript:alert(1)")).toBe("");
  expect(safeFunnelUrl("data:text/html,evil")).toBe("");
  expect(safeFunnelUrl("/shop")).toBe("/shop");
  expect(safeFunnelUrl("https://example.com")).toBe("https://example.com");
  expect(safeFunnelUrl("http://example.com/file.jpg",true)).toBe("");
 });
 it("accepts fully configurable banner, slider and carousel blocks",()=>{
  for(const kind of ["banner","slider","carousel"] as const){
   const block=initialFunnelBlock(kind);
   expect(funnelContent.safeParse({...base().content,blocks:[block]}).success).toBe(true);
  }
 });
 it("rejects duplicate slide identities, invalid timing and injected per-slide fields",()=>{
  const block=initialFunnelBlock("slider");
  const slide=block.slides[0];
  expect(funnelContent.safeParse({...base().content,blocks:[{...block,slides:[slide,slide]}]}).success).toBe(false);
  expect(funnelContent.safeParse({...base().content,blocks:[{...block,intervalMs:100}]}).success).toBe(false);
  expect(funnelContent.safeParse({...base().content,blocks:[{...block,slides:[{...slide,onload:"alert(1)"}]}]}).success).toBe(false);
  expect(funnelContent.safeParse({...base().content,blocks:[{...block,slides:[{...slide,imageUrl:"https://cdn.example.com/slide.jpg",title:"Holiday",buttonUrl:"/shop"}]}]}).success).toBe(true);
 });
  it("preserves independent banner, slider, carousel, and image media editing data",()=>{
  const banner=initialFunnelBlock("banner");
  const slider=initialFunnelBlock("slider");
  const image=initialFunnelBlock("image");
  const content={...base().content,blocks:[
   {...banner,imageUrl:"https://cdn.example.com/banner.webp",title:"Custom Banner",buttonLabel:"Order Now",buttonUrl:"/shop"},
   {...slider,slides:[{...slider.slides[0],imageUrl:"https://cdn.example.com/one.webp",title:"Slide one"},
                       {...slider.slides[1],imageUrl:"https://cdn.example.com/two.webp",title:"Slide two"}]},
   {...image,imageUrl:"https://cdn.example.com/picture.webp",body:"My caption",buttonLabel:"Browse",buttonUrl:"/shop"}
  ]};
  const parsed=funnelContent.parse(content);
  expect(parsed.blocks[0].imageUrl).toContain("banner.webp");
  expect(parsed.blocks[1].slides.map(x=>x.imageUrl)).toHaveLength(2);
  expect(parsed.blocks[2].buttonLabel).toBe("Browse");
 });
  it("does not accept unbounded page content",()=>{
  const content={...base().content,title:"a".repeat(101)};
  expect(funnelContent.safeParse(content).success).toBe(false);
 });
});
