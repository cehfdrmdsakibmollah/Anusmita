"use client";
import {useEffect,useState} from "react";
import {Save,RotateCcw,X,ShieldCheck,Code2,Palette} from "lucide-react";
import {buildHomeStyleCss,defaultHomeStyle,homeStyleSchema,type HomeStyle} from "@/lib/homepage-styles";
import "./homepage-style-editor.css";
type Mode="global"|"css";
export default function HomepageStyleEditor({mode,onClose}:{mode:Mode;onClose:()=>void}){
 const [styles,setStyles]=useState<HomeStyle>(defaultHomeStyle),[saved,setSaved]=useState<HomeStyle>(defaultHomeStyle);
 const [revision,setRevision]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[loaded,setLoaded]=useState(false);
 async function load(){setMessage("");const r=await fetch("/api/admin/homepage/styles",{cache:"no-store"});const data=await r.json();if(!r.ok)throw Error(data.error||"Could not load styles");const parsed=homeStyleSchema.parse(data.styles);setStyles(parsed);setSaved(parsed);setRevision(data.revision);setLoaded(true);}
 useEffect(()=>{void load().catch(e=>setMessage(e instanceof Error?e.message:String(e)));},[]);
 const dirty=JSON.stringify(saved)!==JSON.stringify(styles);
 function change<K extends keyof HomeStyle>(key:K,value:HomeStyle[K]){setStyles(s=>({...s,[key]:value}));setMessage("");}
 async function save(){
  if(!dirty||busy)return;
  setBusy(true);setMessage("");
  try{
   buildHomeStyleCss(styles);
   const r=await fetch("/api/admin/homepage/styles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...styles,revision})});
   const data=await r.json();if(!r.ok)throw Error(data.error||"Unable to save styles");
   setSaved(styles);setRevision(data.revision);setMessage("Saved successfully. Refresh the public homepage to view the new styling.");
  }catch(e){setMessage("Error: "+(e instanceof Error?e.message:String(e)));}
  finally{setBusy(false);}
 }
 const preview=(()=>{try{return buildHomeStyleCss(styles);}catch{return "";}})();
 return <section className="anStyleEditor" aria-label={mode==="global"?"Global Styles Editor":"Custom CSS Editor"}>
  <div className="anStyleEditorTitle"><div>{mode==="global"?<Palette size={19}/>:<Code2 size={19}/>}<h2>{mode==="global"?"Global Styles":"Custom CSS"}</h2><span>Homepage only</span></div><button type="button" aria-label="Close style editor" onClick={()=>{if(!dirty||window.confirm("Discard unsaved styling changes?"))onClose();}}><X size={18}/></button></div>
  {!loaded?<p role="status">{message||"Loading saved styling…"}</p>:<>
   <p className="anStyleInfo"><ShieldCheck size={15}/> Changes are scoped to the public homepage. The product catalog, admin, checkout and CMS sections are unaffected.</p>
   {mode==="global"?<div className="anStyleFields">
     {([["primary","Primary / CTA"],["accent","Accent"],["background","Category background"],["text","Heading text"]] as const).map(([key,label])=><label key={key}>{label}<div className="anStyleColor"><input type="color" aria-label={label+" color picker"} value={styles[key]} onChange={e=>change(key,e.target.value)}/><input aria-label={label+" hex color"} maxLength={7} value={styles[key]} onChange={e=>change(key,e.target.value)}/></div></label>)}
     <label>Heading font<select value={styles.headingFont} onChange={e=>change("headingFont",e.target.value as HomeStyle["headingFont"])}><option>Georgia</option><option>Arial</option><option>Times New Roman</option></select></label>
     <label>CTA button radius (0–32 px)<input type="number" min="0" max="32" step="1" value={styles.radius} onChange={e=>change("radius",Number(e.target.value))}/></label>
    </div>:<div className="anStyleCssPane">
      <label htmlFor="anCustomCssSource">Safe homepage CSS rules</label>
      <textarea id="anCustomCssSource" spellCheck={false} value={styles.customCss} maxLength={3000} rows={10} onChange={e=>change("customCss",e.target.value)} placeholder={".anPromo { background-color: #fff1f5; }\n.anSectionTitle h2 { color: #87153f; font-size: 30px; }"}/>
      <p>Allowed selectors: <code>.anPromo</code>, <code>.anPromoCopy h2</code>, <code>.anCategories</code>, <code>.anSectionTitle h2</code>, <code>.anAction</code>, <code>.anCuratedCard</code>, <code>.anTrustBar</code>, <code>.anPromise</code>.</p>
      <p>Allowed properties: text/background/border color, font size/weight, border radius, spacing and text alignment. JavaScript, URL, global selectors and arbitrary CSS are blocked.</p>
     </div>}
    <div className="anStylePreview" aria-label="Style preview" style={{backgroundColor:styles.background,color:styles.text}}>
      <style>{preview.replaceAll(".anHomeStyleScope",".anStylePreview")}</style>
      <h3 style={{fontFamily:styles.headingFont}} className="anSectionTitle"><span>ANUSMITA Preview</span></h3>
      <p>Brand colors & typography preview. The public homepage uses saved values.</p>
      <span className="anAction" style={{display:"inline-block",backgroundColor:styles.primary,color:"#fff",borderRadius:styles.radius,padding:"9px 18px"}}>Shop Now</span>
    </div>
    <div className="anStyleEditorActions"><button type="button" onClick={()=>setStyles(saved)} disabled={!dirty||busy}><RotateCcw size={15}/> Discard Changes</button><button type="button" onClick={()=>void save()} disabled={!dirty||busy}><Save size={15}/>{busy?"Saving…":"Save "+(mode==="global"?"Global Styles":"Custom CSS")}</button><span>Revision {revision} · {dirty?"Unsaved changes":"Saved"}</span></div>
   </>}
  {message&&<p className={message.startsWith("Error")?"anStyleError":"anStyleSuccess"} role="status">{message}</p>}
 </section>;
}
