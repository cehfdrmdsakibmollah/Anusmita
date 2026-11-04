import {describe,it,expect} from "vitest";
import {parseProductDescription} from "./rich-product-description";
describe("product description formatting",()=>{
 it("preserves existing plain text",()=>expect(parseProductDescription("A gentle cream")[0]).toEqual({kind:"paragraph",value:"A gentle cream"}));
 it("recognizes headings, bullets and numbered lists",()=>{
  expect(parseProductDescription("## Ingredients\n- Glycerin\n1. Apply").map(x=>x.kind)).toEqual(["heading","bullet","number"]);
 });
 it("never constructs executable markup",()=>expect(parseProductDescription("<script>alert(1)</script>")[0].value).toBe("<script>alert(1)</script>"));
});