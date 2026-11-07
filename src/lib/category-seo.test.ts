import {describe,expect,it} from "vitest";
import {categorySeoMetadata,categorySeoPath,categoriesWithPublishedProducts,isCategorySeoSlug} from "./category-seo";
import {buildProductSeoGraph} from "./product-seo-structured";
describe("active category SEO landing pages",()=>{
 it("uses manual SEO overrides, then safe automatic copy",()=>{
  expect(categorySeoMetadata({name:"Skincare",slug:"skincare",seoTitle:"Shop Centella & Skincare",seoDescription:"Shop original skincare with real descriptions"}))
   .toEqual({title:"Shop Centella & Skincare",description:"Shop original skincare with real descriptions",canonical:"/collections/skincare"});
  expect(categorySeoMetadata({name:"Jewellery",slug:"jewellery"}).title).toContain("Jewellery Collection");
 });
 it("accepts only safe normalized category slugs",()=>{
  expect(categorySeoPath("makeup-care")).toBe("/collections/makeup-care");
  for(const value of ["../admin","UPPER","skin?category=x","","http://evil.example","a".repeat(121)])
   expect(isCategorySeoSlug(value)).toBe(false);
  expect(categorySeoPath("../admin")).toBeNull();
 });
 it("sitemaps only active known categories with actual published catalogue matches",()=>{
  const registry=[{name:"Skincare",slug:"skincare",active:true},{name:"Fashion",slug:"fashion",active:false},{name:"Makeup",slug:"makeup",active:true}];
  expect(categoriesWithPublishedProducts(registry,new Set(["Skincare","Fashion"])).map(c=>c.slug)).toEqual(["skincare"]);
 });
 it("uses category canonical breadcrumb only from approved internal collection URLs",()=>{
  const p={name:"Serum",slug:"serum",category:"Skincare",categoryPath:"/collections/skincare",active:true,pricePaisa:10000};
  const x=buildProductSeoGraph(p);
  expect(x?.breadcrumb.itemListElement[2].item).toBe("https://anusmita.netlify.app/collections/skincare");
  const unsafe=buildProductSeoGraph({...p,categoryPath:"https://evil.example"});
  expect(unsafe?.breadcrumb.itemListElement[2].item).toContain("/shop?category=Skincare");
 });
});
