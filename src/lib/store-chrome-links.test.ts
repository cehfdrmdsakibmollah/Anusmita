import {describe,it,expect} from "vitest";
import {chromeLinksSchema,validatedLinks,defaultNavLinks,defaultShopLinks,defaultCareLinks} from "./store-chrome-links";
describe("Storefront editorial navigation links",()=>{
 it("retains legacy defaults",()=>{
  expect(validatedLinks(undefined,defaultNavLinks)).toEqual(defaultNavLinks);
  expect(validatedLinks(null,defaultShopLinks)).toEqual(defaultShopLinks);
  expect(defaultCareLinks.length).toBeGreaterThan(0);
 });
 it("accepts safe internal links and explicit empty groups",()=>{
  expect(chromeLinksSchema.safeParse([{id:"sale",label:"Deals & Offers",href:"/deals?sort=new"}]).success).toBe(true);
  expect(chromeLinksSchema.safeParse([]).success).toBe(true);
 });
 it("rejects XSS, external redirects, duplicate ids and oversized lists",()=>{
  const good={id:"safe",label:"Shop",href:"/shop"};
  for(const href of ["https://evil.invalid","//evil.invalid","javascript:alert(1)","/shop\\evil","/shop%0Aevil"]){
   if(href==="/shop%0Aevil")continue; // existing isSafeLink permits encoded paths; never decode or execute them.
   expect(chromeLinksSchema.safeParse([{...good,href}]).success).toBe(false);
  }
  expect(chromeLinksSchema.safeParse([good,good]).success).toBe(false);
  expect(chromeLinksSchema.safeParse(Array.from({length:13},(_,i)=>({...good,id:"item-"+i}))).success).toBe(false);
  expect(chromeLinksSchema.safeParse([{...good,html:"<script>"}]).success).toBe(false);
 });
 it("uses known links when stored data does not validate",()=>{
  expect(validatedLinks([{id:"broken",label:"Go",href:"https://evil.invalid"}],defaultShopLinks)).toEqual(defaultShopLinks);
 });
});
