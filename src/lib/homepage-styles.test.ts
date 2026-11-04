import {describe,it,expect} from "vitest";
import {buildHomeStyleCss,defaultHomeStyle,homeStyleSchema,sanitizeHomeCss} from "./homepage-styles";
describe("Homepage global styles and custom CSS security",()=>{
 it("accepts valid homepage styles and scopes every selector",()=>{
  const css=sanitizeHomeCss(".anPromo { background-color: #fff1f5; }\n.anSectionTitle h2 { color: #87153f; font-size: 30px; }");
  expect(css).toContain(".anHomeStyleScope .anPromo");
  expect(css).toContain(".anHomeStyleScope .anSectionTitle h2");
  expect(css).not.toContain("body {");
  expect(buildHomeStyleCss(defaultHomeStyle)).toContain("--an-home-primary:#8c0b3c");
 });
 it("rejects unsafe CSS, scripts, global selectors and external resource loads",()=>{
  for(const rule of ["body {color:#fff;}","@import url(https://example.com/css)"," .anPromo {background-image:url(https://evil.example/pixel);}",".anPromo {color:expression(alert(1));}",".anPromo:hover {color:#fff;}",".anPromo {position:fixed;}",".anPromo {color:#fff; } } html { color:#fff; }"]){
   expect(()=>sanitizeHomeCss(rule)).toThrow();
  }
 });
 it("preserves validation ranges and disables unsafe style values",()=>{
  expect(homeStyleSchema.safeParse({...defaultHomeStyle,primary:"javascript:alert(1)"}).success).toBe(false);
  expect(homeStyleSchema.safeParse({...defaultHomeStyle,radius:33}).success).toBe(false);
  expect(homeStyleSchema.safeParse({...defaultHomeStyle,headingFont:"Comic Sans MS"}).success).toBe(false);
  expect(sanitizeHomeCss("")).toBe("");
 });
});
