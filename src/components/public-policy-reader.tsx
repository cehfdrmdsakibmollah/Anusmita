"use client";
import {useMemo,useState} from "react";
import {BookOpen,Printer,Sun,Moon,ZoomIn,ZoomOut} from "lucide-react";
import "./public-policy-reader.css";
type PolicyBlock={id:string;type:"heading"|"paragraph"|"callout"|"bullet"|"numbered"|"faq"|"quote"|"divider";text:string;textBn?:string;answer?:string;answerBn?:string};
type Props={title:string;titleBn?:string;description:string;descriptionBn?:string;blocks:PolicyBlock[];updatedAt?:string};
/** Safely convert a small allowlisted formatting syntax into React nodes.
 * No HTML parsing, script injection or user CSS execution. */
function inlineText(value:string){
 const chunks=value.split(/(\\*\\*[^*\\n]+\\*\\*|\\+\\+[^+\\n]+\\+\\+|\\*[^*\\n]+\\*)/g);
 return chunks.map((v,i)=>v.startsWith("**")&&v.endsWith("**")?<strong key={i}>{v.slice(2,-2)}</strong>:v.startsWith("++")&&v.endsWith("++")?<u key={i}>{v.slice(2,-2)}</u>:v.startsWith("*")&&v.endsWith("*")?<em key={i}>{v.slice(1,-1)}</em>:v);
}
export default function PublicPolicyReader({title,titleBn,description,descriptionBn,blocks,updatedAt}:Props){
 const [lang,setLang]=useState<"en"|"bn">("en"),[dark,setDark]=useState(false),[font,setFont]=useState(16);
 const content=(b:PolicyBlock)=>lang==="bn"&&b.textBn?.trim()?b.textBn:b.text;
 const answer=(b:PolicyBlock)=>lang==="bn"&&b.answerBn?.trim()?b.answerBn:b.answer||"";
 const text=blocks.map(b=>content(b)+" "+answer(b)).join(" ");
 const words=useMemo(()=>Math.max(1,Math.ceil(text.trim().split(/\s+/).filter(Boolean).length/200)),[text]);
 const headings=blocks.map((b,i)=>({b,i})).filter(v=>v.b.type==="heading");
 const displayTitle=lang==="bn"&&titleBn?.trim()?titleBn:title;
 return <article className={"anPolicyReader"+(dark?" dark":"")} style={{fontSize:font}}>
  <header className="anPolicyHero">
   <p className="anPolicyEyebrow">ANUSMITA · OFFICIAL DOCUMENT</p>
   <h1>{displayTitle}</h1>
   {(lang==="bn"&&descriptionBn?descriptionBn:description)&&<p>{lang==="bn"&&descriptionBn?descriptionBn:description}</p>}
   <div className="anPolicyMeta"><span><BookOpen size={14}/> {words} min read</span>{updatedAt&&<span>Last updated: {new Date(updatedAt).toLocaleDateString(lang==="bn"?"bn-BD":"en-GB")}</span>}</div>
  </header>
  <div className="anPolicyTools" aria-label="Reading controls">
   <div className="anPolicyLanguage"><button type="button" className={lang==="en"?"active":""} onClick={()=>setLang("en")} aria-pressed={lang==="en"}>English</button><button type="button" className={lang==="bn"?"active":""} onClick={()=>setLang("bn")} aria-pressed={lang==="bn"}>বাংলা</button></div>
   <button type="button" onClick={()=>setFont(v=>Math.max(13,v-1))} aria-label="Decrease text size"><ZoomOut size={16}/></button>
   <button type="button" onClick={()=>setFont(v=>Math.min(22,v+1))} aria-label="Increase text size"><ZoomIn size={16}/></button>
   <button type="button" onClick={()=>setDark(v=>!v)}>{dark?<Sun size={16}/>:<Moon size={16}/>} {dark?"Light":"Dark"}</button>
   <button type="button" onClick={()=>window.print()}><Printer size={16}/> Print / PDF</button>
  </div>
  <div className="anPolicyBody">
   {headings.length>1&&<nav className="anPolicyToc" aria-label="Table of contents"><strong>On this page</strong>{headings.map(({b,i})=><a key={b.id} href={"#policy-section-"+i}>{content(b)}</a>)}</nav>}
   <div className="anPolicyBlocks" lang={lang} dir="auto">{blocks.map((b,i)=>{
    const t=content(b);
    if(b.type==="heading")return <h2 id={"policy-section-"+i} key={b.id}>{inlineText(t)}</h2>;
    if(b.type==="divider")return <hr key={b.id}/>;
    if(b.type==="quote")return <blockquote key={b.id}>{inlineText(t)}</blockquote>;
    if(b.type==="callout")return <aside key={b.id} className="anPolicyCallout">{inlineText(t)}</aside>;
    if(b.type==="faq")return <details key={b.id} className="anPolicyFaq"><summary>{inlineText(t)}</summary><p>{inlineText(answer(b))}</p></details>;
    if(b.type==="bullet"||b.type==="numbered"){const items=t.split("\n").map(v=>v.trim()).filter(Boolean);return b.type==="bullet"?<ul key={b.id}>{items.map((v,k)=><li key={k}>{inlineText(v)}</li>)}</ul>:<ol key={b.id}>{items.map((v,k)=><li key={k}>{inlineText(v)}</li>)}</ol>;}
    return <p key={b.id}>{inlineText(t)}</p>;
   })}</div>
  </div>
 </article>;
}
