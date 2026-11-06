import {describe,it,expect} from "vitest";
import {shouldConfirmCmsPageSwitch,shouldConfirmCustomDraftReplacement} from "./cms-navigation-guard";
describe("Universal CMS navigation safety",()=>{
 it("guards a dirty secondary page, including switching to Homepage",()=>{
  expect(shouldConfirmCmsPageSwitch("Shop","Deals",false,true)).toBe(true);
  expect(shouldConfirmCmsPageSwitch("Deals","Homepage",false,true)).toBe(true);
 });
 it("guards unsaved Homepage edits when opening a secondary page",()=>{
  expect(shouldConfirmCmsPageSwitch("Homepage","Shop",true,false)).toBe(true);
 });
 it("never prompts for same page or clean state",()=>{
  expect(shouldConfirmCmsPageSwitch("Shop","Shop",true,true)).toBe(false);
  expect(shouldConfirmCmsPageSwitch("Shop","Cart",true,false)).toBe(false);
  expect(shouldConfirmCmsPageSwitch("Homepage","Shop",false,true)).toBe(false);
 });
 it("guards replacement of unsaved custom page drafts",()=>{
  expect(shouldConfirmCustomDraftReplacement(true,true)).toBe(true);
  expect(shouldConfirmCustomDraftReplacement(false,true)).toBe(false);
  expect(shouldConfirmCustomDraftReplacement(true,false)).toBe(false);
 });
});
