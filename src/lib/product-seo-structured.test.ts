import {describe,it,expect} from "vitest";
import {buildProductSeoGraph,validProductGtin13,verifiedRating,safeSeoJsonLd,productSeoUrl} from "./product-seo-structured";
const product={active:true,name:"Centella Ampoule",slug:"centella-ampoule",category:"Skincare",brand:"Skin1004",sku:"ANUS-400",barcode:"4006381333931",description:"Pure centella facial care",imageUrls:["/image.webp"],pricePaisa:245000,onHand:3,reserved:1,availabilityMode:"now",verifiedReviewCount:4,verifiedRatingValue:4.25};
describe("factual Product + Breadcrumb SEO graph",()=>{
 it("emits canonical real storefront path and verifiable metadata only",()=>{
  const graph=buildProductSeoGraph(product);
  expect(graph?.product.url).toBe("https://anusmita.netlify.app/products/centella-ampoule");
  expect(graph?.product.sku).toBe("ANUS-400");
  expect(graph?.product.gtin13).toBe("4006381333931");
  expect(graph?.product.aggregateRating).toEqual({"@type":"AggregateRating",ratingValue:4.25,reviewCount:4});
  expect(graph?.product.offers?.price).toBe("2450.00");
  expect(graph?.product.offers?.availability).toContain("InStock");
  expect(graph?.breadcrumb.itemListElement.map(x=>x.position)).toEqual([1,2,3,4]);
  expect(JSON.stringify(graph)).not.toContain("priceValidUntil");
 });
 it("does not invent ratings, discounts, GTIN, review count or offer expiry",()=>{
  const graph=buildProductSeoGraph({...product,barcode:"1234567890123",verifiedReviewCount:0,verifiedRatingValue:5,pricePaisa:0});
  expect(graph?.product.aggregateRating).toBeUndefined();
  expect(graph?.product.gtin13).toBeUndefined();
  expect(graph?.product.offers).toBeUndefined();
  expect(validProductGtin13("4006381333931")).toBe(true);
  expect(validProductGtin13("4006381333932")).toBe(false);
  expect(verifiedRating({verifiedReviewCount:0,verifiedRatingValue:5})).toBeUndefined();
 });
 it("uses real preorder mode and availability, not invented inventory status",()=>{
  expect(buildProductSeoGraph({...product,onHand:0,reserved:0,availabilityMode:"preorder"})?.product.offers?.availability).toContain("PreOrder");
  expect(buildProductSeoGraph({...product,onHand:1,reserved:1})?.product.offers?.availability).toContain("OutOfStock");
  expect(buildProductSeoGraph({...product,active:false})).toBeNull();
  expect(buildProductSeoGraph(product,{schemaEnabled:false})).toBeNull();
 });
 it("safely escapes JSON-LD and encodes canonical slugs",()=>{
  const text=safeSeoJsonLd({name:"<script>alert(1)</script>"});
  expect(text).not.toContain("<script>");
  expect(text).toContain("\\u003cscript");
  expect(productSeoUrl("centella-ampoule?utm_source=foo")).toContain("centella-ampoule%3Futm_source%3Dfoo");
 });
});
