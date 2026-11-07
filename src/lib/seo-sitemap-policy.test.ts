import {describe,it,expect} from "vitest";
import {indexableSitemapProducts,privateRobotPaths} from "./seo-sitemap-policy";
const rows=[
 {_id:"a",slug:"active-product",active:true,archived:false},
 {_id:"b",slug:"disabled-product",active:true,archived:false},
 {_id:"c",slug:"archived-product",active:true,archived:true},
 {_id:"d",slug:"draft-product",active:false},
 {_id:"e",slug:"bad?utm_source=ad",active:true},
 {_id:"f",slug:"valid-product-2",active:true,archived:false}
];
describe("production sitemap & robots policy",()=>{
 it("includes only public active nonarchived URLs that do not request noindex",()=>{
  expect(indexableSitemapProducts(rows,new Set(["b"])).map(x=>x.slug)).toEqual(["active-product","valid-product-2"]);
 });
 it("never exposes malformed slugs or inactive/archived pages",()=>{
  expect(indexableSitemapProducts(rows,new Set()).map(x=>x.slug)).not.toContain("bad?utm_source=ad");
  expect(indexableSitemapProducts(rows,new Set()).map(x=>x.slug)).not.toContain("archived-product");
  expect(indexableSitemapProducts(rows,new Set()).map(x=>x.slug)).not.toContain("draft-product");
 });
 it("covers admin, auth, transactional pages, API and search crawler traps",()=>{
  for(const route of ["/admin","/admin/","/api/","/checkout","/cart","/account","/wishlist","/search"])
   expect(privateRobotPaths).toContain(route);
  expect(privateRobotPaths).not.toContain("/products");
  expect(privateRobotPaths).not.toContain("/shop");
 });
});
