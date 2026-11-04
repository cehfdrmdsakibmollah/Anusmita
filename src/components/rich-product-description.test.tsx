import {describe,it,expect} from "vitest";
import {parseProductDescription} from "./rich-product-description";
describe("Product description H1/H2/H3 format",()=>{
 it("keeps legacy description text as paragraphs",()=>expect(parseProductDescription("Normal text")[0]).toMatchObject({kind:"paragraph",value:"Normal text"}));
 it("keeps heading hierarchy",()=>expect(parseProductDescription("# Hero\n## Details\n### Features").map(x=>x.level)).toEqual([1,2,3]));
 it("keeps unsafe HTML as text instead of parsing markup",()=>expect(parseProductDescription("<script>alert(1)</script>")[0].value).toBe("<script>alert(1)</script>"));
 it("parses lists and quote blocks",()=>expect(parseProductDescription("- Bullet\n1. First\n> Important").map(x=>x.kind)).toEqual(["bullet","number","quote"]));
});
