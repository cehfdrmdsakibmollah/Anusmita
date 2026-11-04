import {z} from "zod";

const color=z.string().regex(/^#[0-9a-fA-F]{6}$/,"Use a six-digit hex color, e.g. #8c0b3c");
export const homeStyleSchema=z.object({
 primary:color,accent:color,background:color,text:color,
 headingFont:z.enum(["Georgia","Arial","Times New Roman"]),
 radius:z.number().int().min(0).max(32),
 customCss:z.string().max(3000)
}).strict();
export type HomeStyle=z.infer<typeof homeStyleSchema>;
export const defaultHomeStyle:HomeStyle={
 primary:"#8c0b3c",accent:"#fce3ec",background:"#fff9fa",text:"#421322",
 headingFont:"Georgia",radius:8,customCss:""
};
// Only known homepage selectors and a limited set of harmless style declarations.
// No url(), expressions, @rules, pseudo selectors or global selectors are accepted.
const selectors=new Set([".anPromo",".anPromoCopy h2",".anCategories",".anSectionTitle h2",".anAction",".anCuratedCard",".anTrustBar",".anPromise"]);
const colorProps=new Set(["color","background-color","border-color"]);
const sizeProps=new Set(["font-size","border-radius","letter-spacing","margin-top","margin-bottom","padding-top","padding-bottom"]);
const otherProps=new Set(["font-weight","text-align"]);
function validDecl(prop:string,value:string){
 if(colorProps.has(prop))return /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(value);
 if(sizeProps.has(prop))return /^(?:0|[0-9]{1,3}(?:\.[0-9])?(?:px|rem|%))$/.test(value);
 if(prop==="font-weight")return /^(?:400|500|600|700|800)$/.test(value);
 if(prop==="text-align")return /^(?:left|right|center)$/.test(value);
 return false;
}
export function sanitizeHomeCss(input:string):string{
 if(!input.trim())return "";
 if(input.length>3000)throw Error("Custom CSS is limited to 3000 characters");
 let at=0;const rules:string[]=[];
 const regex=/\s*([^{}]+)\{([^{}]*)\}\s*/gy;
 while(at<input.length){
  regex.lastIndex=at;
  const match=regex.exec(input);
  if(!match)throw Error("Only simple CSS selector { property: value; } rules are supported");
  const selector=match[1].trim();
  if(!selectors.has(selector))throw Error("Unsupported homepage selector: "+selector);
  const declarations=match[2].split(";").map(x=>x.trim()).filter(Boolean);
  if(!declarations.length||declarations.length>20)throw Error("Each rule needs 1–20 declarations");
  const safe=declarations.map(line=>{
   const m=/^([a-z-]+)\s*:\s*(.+)$/.exec(line);
   if(!m||!validDecl(m[1],m[2].trim()))throw Error("Unsupported or unsafe CSS declaration: "+line);
   return m[1]+":"+m[2].trim();
  });
  rules.push(".anHomeStyleScope "+selector+"{"+safe.join(";")+"}");
  if(rules.length>16)throw Error("Maximum 16 custom CSS rules");
  at=regex.lastIndex;
 }
 return rules.join("\n");
}
export function buildHomeStyleCss(value:HomeStyle):string{
 const parsed=homeStyleSchema.parse(value);
 const custom=sanitizeHomeCss(parsed.customCss);
 const font=parsed.headingFont==="Times New Roman"?"'Times New Roman',serif":parsed.headingFont+",serif";
 const root=".anHomeStyleScope";
 return [
  root+"{--an-home-primary:"+parsed.primary+";--an-home-accent:"+parsed.accent+";--an-home-background:"+parsed.background+";--an-home-text:"+parsed.text+";}",
  root+" .anAction{background-color:var(--an-home-primary);border-radius:"+parsed.radius+"px}",
  root+" .anPromoCopy h2,"+root+" .anSectionTitle h2{color:var(--an-home-text);font-family:"+font+"}",
  root+" .anCategories{background-color:var(--an-home-background)}",
  root+" .anTrustBar{border-color:var(--an-home-accent)}",
  custom
 ].join("\n");
}
