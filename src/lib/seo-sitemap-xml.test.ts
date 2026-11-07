import {describe,expect,it} from "vitest";
import {escapeSitemapXml,sitemapBaseUrl,sitemapDocument,sitemapIndexDocument,sitemapSegmentFromPath,sitemapSegments,SITEMAP_SEGMENT_SIZE} from "./seo-sitemap-xml";
import {trustedOgProductImage} from "./product-og-image";
describe("segmented XML sitemap generation",()=>{
 it("segments catalogues without the former 10k URL ceiling",()=>{
  expect(SITEMAP_SEGMENT_SIZE).toBe(2000);
  expect(sitemapSegments(0)).toEqual([]);
  expect(sitemapSegments(1)).toEqual([0]);
  expect(sitemapSegments(2001)).toEqual([0,1]);
  expect(sitemapSegments(12001)).toEqual([0,1,2,3,4,5,6]);
 });
 it("rejects invalid path segments and limits indices",()=>{
  expect(sitemapSegmentFromPath("0.xml")).toBe(0);
  expect(sitemapSegmentFromPath("120.xml")).toBe(120);
  for(const bad of ["0","01.xml","-1.xml","1.xml?x","../1.xml","100000.xml","abc.xml"])
   expect(sitemapSegmentFromPath(bad)).toBeNull();
 });
 it("escapes all XML special characters in URLs and keeps valid dates only",()=>{
  expect(escapeSitemapXml('&<>"\'')).toBe("&amp;&lt;&gt;&quot;&apos;");
  const xml=sitemapDocument([{url:"https://example.com/products?x=1&y=2",lastModified:"2026-11-08T00:00:00Z"},
   {url:"https://example.com/second",lastModified:"invalid"}]);
  expect(xml).toContain("x=1&amp;y=2");
  expect(xml).toContain("<lastmod>2026-11-08T00:00:00.000Z</lastmod>");
  expect(xml.match(/<lastmod>/g)).toHaveLength(1);
  expect(sitemapIndexDocument(["https://a.example/?x=1&y=2"])).toContain("x=1&amp;y=2");
 });
 it("never trusts malformed sitemap origins",()=>{
  expect(sitemapBaseUrl("https://anusmita.netlify.app")).toBe("https://anusmita.netlify.app");
  expect(sitemapBaseUrl("http://evil.example")).toBe("https://anusmita.netlify.app");
  expect(sitemapBaseUrl("https://example.com/path")).toBe("https://anusmita.netlify.app");
 });
});
describe("social share media SSRF guard",()=>{
 it("permits only our specific trusted R2 Worker and HTTPS",()=>{
  expect(trustedOgProductImage("https://anusmita-media.mdsakibmolla545.workers.dev/products/a.webp"))
   .toBe("https://anusmita-media.mdsakibmolla545.workers.dev/products/a.webp");
  for(const bad of [
   "http://anusmita-media.mdsakibmolla545.workers.dev/a.png",
   "https://anusmita-media.mdsakibmolla545.workers.dev.evil.com/a.webp",
   "https://evil.example/a.webp",
   "file:///etc/passwd",
   "https://user:pass@anusmita-media.mdsakibmolla545.workers.dev/a.webp",
   "https://anusmita-media.mdsakibmolla545.workers.dev/a.webp#fragment"
  ])expect(trustedOgProductImage(bad)).toBeNull();
 });
});
