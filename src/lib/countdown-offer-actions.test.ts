import {describe,it,expect} from "vitest";
import {offerIsStored,offerDeletePlan,offerEditorPage} from "./countdown-offer-actions";
describe("Homepage countdown CRUD routing",()=>{
 const saved=[{id:"existing-1"},{id:"existing-2"}];
 it("edits existing saved offers using database edit/delete",()=>{
  expect(offerIsStored(saved,"existing-1")).toBe(true);
  expect(offerDeletePlan(saved,"existing-1")).toBe("delete-persisted");
 });
 it("discards never-saved drafts in client state without calling homepage delete API",()=>{
  expect(offerIsStored(saved,"new-local-draft")).toBe(false);
  expect(offerDeletePlan(saved,"new-local-draft")).toBe("discard-unsaved");
 });
 it("opens the Homepage editor even if the page switch is currently Deals",()=>{
  expect(offerEditorPage()).toBe("Homepage");
 });
 it("treats missing or deleted IDs as unsaved rather than trusting preview rows",()=>{
  expect(offerDeletePlan([],"stale")).toBe("discard-unsaved");
 });
});
