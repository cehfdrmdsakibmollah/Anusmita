import type {CSSProperties} from "react";
import Link from "next/link";
import FunnelCountdown from "./funnel-countdown";
import {safeFunnelStyle,safeFunnelUrl,type funnelBlock} from "@/lib/funnel-pages";
import type {z} from "zod";
import "./funnel-public.css";
type Block=z.infer<typeof funnelBlock>;
function Button({url,label}:{url:string;label:string}){
 const href=safeFunnelUrl(url);
 if(!href)return null;
 if(href.startsWith("/"))return <Link className="anFunnelCta" href={href}>{label||"Shop Now"}</Link>;
 return <a className="anFunnelCta" href={href} rel="noopener noreferrer" target="_blank">{label||"Shop Now"}</a>;
}
export function FunnelBlocks({blocks,selected,onPick}:{blocks:Block[];selected?:string|null;onPick?:(id:string)=>void}){
 return <div className="anFunnelBody">
 {blocks.map(block=>{
  const style=safeFunnelStyle(block.style) as CSSProperties;
  const image=safeFunnelUrl(block.imageUrl,true);
  const headingStyle:CSSProperties={color:style.color,fontFamily:style.fontFamily,fontSize:style.fontSize,fontWeight:style.fontWeight,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing,textAlign:style.textAlign};
  const content=<>
   {block.kind==="divider"?<hr/>:
   block.kind==="image"?image?<img loading="lazy" src={image} alt={block.title||"Campaign image"}/>:<div className="anFunnelImagePlaceholder">Add a campaign image</div>:
   block.kind==="hero"?<div className="anFunnelHeroGrid"><div><span className="anFunnelEyebrow">ANUSMITA · DISCOVER YOUR GLOW</span><h1 style={headingStyle}>{block.title}</h1><p>{block.body}</p>{block.buttonLabel&&<Button url={block.buttonUrl} label={block.buttonLabel}/>}</div>{image&&<img loading="eager" src={image} alt={block.title}/>}</div>:
   block.kind==="heading"?<h2 style={headingStyle}>{block.title}</h2>:
   block.kind==="paragraph"?<p>{block.body}</p>:
   block.kind==="button"?<Button url={block.buttonUrl} label={block.buttonLabel}/>:
   block.kind==="countdown"?<div className="anFunnelCountdown"><h2>{block.title||"Limited time offer"}</h2><FunnelCountdown expiresAt={block.expiresAt}/><p>{block.body}</p></div>:
   block.kind==="faq"?<><h2>{block.title}</h2><div className="anFunnelFaq">{block.items.map((item,i)=><details key={i}><summary>{item.title}</summary><p>{item.body}</p></details>)}</div></>:
   block.kind==="features"||block.kind==="trust"?<><h2>{block.title}</h2><div className="anFunnelFeatureGrid">{block.items.map((item,i)=><article key={i}><strong>{item.title}</strong><p>{item.body}</p></article>)}</div></>:
   block.kind==="coupon"?<div className="anFunnelCoupon"><h2>{block.title}</h2><p>{block.body}</p><code>{block.buttonLabel}</code></div>:null}
  </>;
  return onPick?
   <div key={block.id} className={"anFunnelBlock anFunnelEditable"+(selected===block.id?" selected":"")} style={style} onClick={event=>{event.preventDefault();onPick(block.id)}} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter")onPick(block.id)}}>{content}</div>:
   <section key={block.id} className="anFunnelBlock" style={style}>{content}</section>;
 })}
 </div>;
}
