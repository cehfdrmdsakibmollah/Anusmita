import {describe,it,expect} from "vitest";
import {searchReadiness,siteEntityGraph} from "./search-readiness";
describe("search readiness",()=>{
 it("reports indexing blocks without exposing credentials",()=>{
  const report=searchReadiness({SESSION_SECRET:"private",MONGODB_URI:"private"});
  expect(report.indexable).toBe(false);
  expect(JSON.stringify(report)).not.toContain("private");
  expect(report.checks.find(check=>check.name==="Google verification")?.passed).toBe(false);
 });
 it("links organization and website without invented business details",()=>{
  const graph=siteEntityGraph("https://anusmita.netlify.app/");
  expect(graph["@graph"][1].publisher).toEqual({"@id":"https://anusmita.netlify.app/#organization"});
  expect(JSON.stringify(graph)).not.toContain("aggregateRating");
 });
});
