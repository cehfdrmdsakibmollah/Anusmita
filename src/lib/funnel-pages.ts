import {z} from "zod";
export const funnelSlug=z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
export const funnelKinds=["hero","banner","slider","carousel","heading","paragraph","image","button","features","faq","divider","countdown","trust","coupon"] as const;
const blockKind=z.enum(funnelKinds);
export const funnelStyle=z.object({
 width:z.string().max(40).optional(),minHeight:z.string().max(40).optional(),
 padding:z.string().max(50).optional(),margin:z.string().max(50).optional(),gap:z.string().max(40).optional(),
 backgroundColor:z.string().max(40).optional(),color:z.string().max(40).optional(),
 fontSize:z.string().max(40).optional(),fontWeight:z.enum(["400","500","600","700","800"]).optional(),
 fontFamily:z.enum(["Georgia","Arial","serif","sans-serif"]).optional(),
 lineHeight:z.string().max(20).optional(),letterSpacing:z.string().max(24).optional(),
 borderWidth:z.string().max(24).optional(),borderColor:z.string().max(40).optional(),
 borderStyle:z.enum(["none","solid","dashed","dotted"]).optional(),
 opacity:z.string().max(12).optional(),
 textAlign:z.enum(["left","center","right"]).optional(),borderRadius:z.string().max(40).optional(),
 boxShadow:z.enum(["none","soft","medium","strong"]).optional(),
 display:z.enum(["block","flex","grid"]).optional(),flexDirection:z.enum(["row","column"]).optional(),
 justifyContent:z.enum(["start","center","end","space-between"]).optional(),
 gridColumns:z.enum(["1","2","3","4"]).optional()
}).strict();
export const funnelSlide=z.object({
 id:z.string().uuid(),
 imageUrl:z.string().max(2048).default(""),
 title:z.string().max(220).default(""),
 body:z.string().max(700).default(""),
 buttonLabel:z.string().max(100).default(""),
 buttonUrl:z.string().max(400).default(""),
 alt:z.string().max(160).default("")
}).strict();
export const funnelBlock=z.object({
 id:z.string().uuid(),kind:blockKind,
 title:z.string().max(220).default(""),body:z.string().max(2400).default(""),
 imageUrl:z.string().max(2048).default(""),buttonLabel:z.string().max(100).default(""),
 buttonUrl:z.string().max(400).default(""),expiresAt:z.string().max(40).default(""),
 items:z.array(z.object({title:z.string().max(140),body:z.string().max(500)}).strict()).max(12).default([]),
 slides:z.array(funnelSlide).max(16).default([]).refine(slides=>new Set(slides.map(s=>s.id)).size===slides.length,"Duplicate slide IDs"),
 autoplay:z.boolean().default(true),intervalMs:z.number().int().min(2000).max(15000).default(5000),
 showArrows:z.boolean().default(true),showDots:z.boolean().default(true),
 style:funnelStyle.default({})
}).strict();
export const funnelContent=z.object({
 title:z.string().trim().min(3).max(100),description:z.string().trim().max(160).default(""),
 seoTitle:z.string().trim().max(70).default(""),noIndex:z.boolean().default(false),
 endsAt:z.union([z.string().datetime(),z.literal("")]).default(""),
 blocks:z.array(funnelBlock).min(1).max(50).refine(blocks=>new Set(blocks.map(b=>b.id)).size===blocks.length,"Duplicate block IDs")
}).strict();
export const funnelWrite=z.object({
 slug:funnelSlug,revision:z.number().int().nonnegative(),
 mode:z.enum(["draft","publish","archive","restore"]),content:funnelContent
}).strict();
const cssLength=/^(?:0|auto|(?:[0-9]{1,4}(?:\.[0-9]{1,2})?)(?:px|%|rem|vh|vw))$/;
const cssSpacing=/^(?:0|auto|[0-9]{1,3}(?:px|rem|%)|[0-9]{1,3}(?:px|rem|%)\s+[0-9]{1,3}(?:px|rem|%)(?:\s+[0-9]{1,3}(?:px|rem|%)){0,2})$/;
const cssColor=/^(?:transparent|#[0-9a-f]{3,8}|(?:rgb|rgba)\(\s*[0-9.,%\s]+\))$/i;
export function safeFunnelUrl(url:string,allowImage=false){
 if(!url)return "";
 try{
  const value=new URL(url,"https://anusmita.netlify.app");
  if(value.protocol!=="https:"&&value.protocol!=="http:")return "";
  if(!/^https?:\/\//i.test(url))return url.startsWith("/")&&!url.startsWith("//")?url:"";
  if(value.username||value.password)return "";
  if(allowImage){
   return value.protocol==="https:"?url:"";
  }
  return url;
 }catch{return "";}
}
export function safeFunnelStyle(style:z.infer<typeof funnelStyle>):Record<string,string|number>{
 const out:Record<string,string|number>={};
 for(const key of ["width","minHeight","fontSize","borderRadius","gap"] as const){const value=style[key];if(value&&cssLength.test(value))out[key]=value;}
 for(const key of ["padding","margin"] as const){const value=style[key];if(value&&cssSpacing.test(value))out[key]=value;}
 for(const key of ["backgroundColor","color"] as const){const value=style[key];if(value&&cssColor.test(value))out[key]=value;}
 for(const key of ["borderWidth","letterSpacing"] as const){const value=style[key];if(value&&/^(?:0|-?[0-9]{1,3}(?:\.[0-9]{1,2})?px)$/.test(value))out[key]=value;}
 if(style.lineHeight&&/^(?:[1-3](?:\.[0-9]{1,2})?|[0-9]{1,3}px)$/.test(style.lineHeight))out.lineHeight=style.lineHeight;
 if(style.borderColor&&cssColor.test(style.borderColor))out.borderColor=style.borderColor;
 if(style.borderStyle)out.borderStyle=style.borderStyle;
 if(style.opacity&&/^(?:0(?:\.[0-9]{1,2})?|1(?:\.0{1,2})?)$/.test(style.opacity))out.opacity=Number(style.opacity);
 if(style.fontFamily)out.fontFamily=style.fontFamily;
  if(style.fontWeight)out.fontWeight=Number(style.fontWeight);
 if(style.textAlign)out.textAlign=style.textAlign;
 if(style.display)out.display=style.display;
 if(style.flexDirection)out.flexDirection=style.flexDirection;
 if(style.justifyContent)out.justifyContent=style.justifyContent==="start"?"flex-start":style.justifyContent==="end"?"flex-end":style.justifyContent;
 if(style.gridColumns)out.gridTemplateColumns="repeat("+style.gridColumns+", minmax(0, 1fr))";
 if(style.boxShadow&&style.boxShadow!=="none")out.boxShadow={
  soft:"0 4px 15px rgba(78,19,45,.10)",medium:"0 12px 28px rgba(78,19,45,.15)",strong:"0 22px 48px rgba(78,19,45,.25)"
 }[style.boxShadow];
 return out;
}
export function initialFunnelSlide(){
 return {id:crypto.randomUUID(),imageUrl:"",title:"Your campaign title",body:"Add your own description",
  buttonLabel:"Shop Now",buttonUrl:"/shop",alt:""};
}
export function initialFunnelBlock(kind:typeof funnelKinds[number]){
 const id=crypto.randomUUID();
 return {id,kind,title:kind==="slider"?"Image Slider":kind==="carousel"?"Image Carousel":kind==="banner"?"Campaign Banner":kind==="hero"?"Discover your glow":kind==="faq"?"Frequently asked questions":"New "+kind,body:kind==="hero"?"A beautiful discovery, made for you.":"",imageUrl:"",buttonLabel:kind==="hero"||kind==="button"?"Shop Now":"",buttonUrl:"/shop",expiresAt:"",items:kind==="faq"?[{title:"How can I order?",body:"Use the official checkout to place your order."}]:[],slides:kind==="slider"||kind==="carousel"?[initialFunnelSlide(),initialFunnelSlide()]:[],autoplay:true,intervalMs:5000,showArrows:true,showDots:true,style:{}};
}
