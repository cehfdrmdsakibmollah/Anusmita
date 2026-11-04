import {describe,it,expect} from "vitest";
import {cmsSaveSchema,cmsSlots} from "./cms-page-slots";
const valid={id:"550e8400-e29b-41d4-a716-446655440000",placement:"before" as const,title:"Autumn beauty edit",subtitle:"Shop selected items",badge:"NEW",imageUrl:"/brand/categories/skincare.webp",cta:"Shop",href:"/shop",enabled:true,position:0};
describe("Unified CMS Page Slots",()=>{
 it("accepts approved editorial content",()=>{expect(cmsSlots.safeParse([valid]).success).toBe(true);});
 it("rejects unsafe external media",()=>{expect(cmsSlots.safeParse([{...valid,imageUrl:"https://attacker.invalid/photo.jpg"}]).success).toBe(false);});
 it("rejects javascript links",()=>{expect(cmsSlots.safeParse([{...valid,href:"javascript:alert(1)"}]).success).toBe(false);});
 it("rejects duplicate block IDs",()=>{expect(cmsSlots.safeParse([valid,valid]).success).toBe(false);});
 it("supports draft and explicit publish but only known pages",()=>{expect(cmsSaveSchema.safeParse({action:"publish",page:"deals",revision:0,slots:[valid]}).success).toBe(true);expect(cmsSaveSchema.safeParse({action:"publish",page:"checkout",revision:0,slots:[valid]}).success).toBe(false);});
 it("rejects unknown properties",()=>{expect(cmsSlots.safeParse([{...valid,html:"<script />"}]).success).toBe(false);});
});
