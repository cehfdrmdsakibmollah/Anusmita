"use client";
import {useEffect,useState} from "react";
type Config={announcement:string;footerNote:string;enabled:boolean;revision:number;headerOrder:string[];footerOrder:string[]};
const headerLabels:Record<string,string>={logo:"Brand logo",navigation:"Main navigation",search:"Product search",tools:"Account, bag & mobile menu"};
const footerLabels:Record<string,string>={brand:"Brand introduction",shop:"Shop links",care:"Customer care links"};
export default function StoreChromeEditor(){
 const [drag,setDrag]=useState<{part:"headerOrder"|"footerOrder";id:string}|null>(null);
 const [config,setConfig]=useState<Config|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 async function load(){
  setLoading(true);setNotice("");
  try{
   const res=await fetch("/api/admin/store-chrome",{cache:"no-store"}),body=await res.json();
   if(!res.ok)throw new Error(body.error||"Unable to load settings");
   setConfig(body);
  }catch(e){setNotice("Error: "+(e instanceof Error?e.message:"Load failed"));}
  finally{setLoading(false);}
 }
 useEffect(()=>{void load();},[]);
 function move(part:"headerOrder"|"footerOrder",from:string,to:string){if(!config||from===to)return;const order=[...config[part]],source=order.indexOf(from),destination=order.indexOf(to);if(source<0||destination<0)return;order.splice(source,1);order.splice(destination,0,from);setConfig({...config,[part]:order});}
 function upDown(part:"headerOrder"|"footerOrder",id:string,delta:number){if(!config)return;const order=config[part],index=order.indexOf(id),target=order[index+delta];if(target)move(part,id,target);}
 function sectionList(part:"headerOrder"|"footerOrder",labels:Record<string,string>){if(!config)return null;return <div className="adminCard"><h3>{part==="headerOrder"?"Header sections":"Footer sections"}</h3><p className="smallprint">Drag a section over another section to reorder it, or use the accessible arrow buttons. Essential navigation and legal links cannot be deleted.</p><div style={{display:"grid",gap:8}}>{config[part].map((id,i)=><div key={id} draggable onDragStart={()=>setDrag({part,id})} onDragEnd={()=>setDrag(null)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(drag?.part===part)move(part,drag.id,id);setDrag(null);}} style={{display:"flex",gap:8,alignItems:"center",padding:12,border:"1px solid #d6c4c4",borderRadius:10,cursor:"grab"}}><span aria-hidden="true">☰</span><strong style={{flex:1}}>{labels[id]||id}</strong><button type="button" aria-label={"Move "+labels[id]+" earlier"} disabled={i===0} className="button small light" onClick={()=>upDown(part,id,-1)}>↑</button><button type="button" aria-label={"Move "+labels[id]+" later"} disabled={i===config[part].length-1} className="button small light" onClick={()=>upDown(part,id,1)}>↓</button></div>)}</div></div>;}
 async function save(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!config)return;setBusy(true);setNotice("");
  try{
   const res=await fetch("/api/admin/store-chrome",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(config)});
   const body=await res.json();if(!res.ok)throw new Error(body.error||"Unable to save");
   setConfig({...config,revision:body.revision});setNotice("Saved successfully. Refresh the storefront to verify content.");
  }catch(e){setNotice("Error: "+(e instanceof Error?e.message:"Save failed"));}
  finally{setBusy(false);}
 }
 return <section className="adminCard">
  <h2>Visual Header & Footer Builder</h2>
  <p className="smallprint">Brand logo, navigation and existing links stay unchanged. Reorder built-in sections visually and edit announcement/footer copy. Changes are inactive until enabled. No custom HTML or scripts.</p>
  {loading&&<p role="status">Loading settings…</p>}
  {notice&&<p role="status">{notice}</p>}
  {config&&<form onSubmit={e=>void save(e)} className="adminForm">
   <div className="field"><label htmlFor="announcementText">Announcement text</label>
    <input id="announcementText" maxLength={180} value={config.announcement} onChange={e=>setConfig({...config,announcement:e.target.value})}/></div>
   <div className="field"><label htmlFor="footerText">Footer brand subtitle</label>
    <input id="footerText" maxLength={240} value={config.footerNote} onChange={e=>setConfig({...config,footerNote:e.target.value})}/></div>
   {sectionList("headerOrder",headerLabels)}
   {sectionList("footerOrder",footerLabels)}
   <div className="adminCard"><h3>Live draft preview</h3><p className="smallprint">Header arrangement</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{config.headerOrder.map(x=><span key={x} style={{padding:8,border:"1px solid #caa",borderRadius:6}}>{headerLabels[x]}</span>)}</div><p className="smallprint">Footer arrangement</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{config.footerOrder.map(x=><span key={x} style={{padding:8,border:"1px solid #caa",borderRadius:6}}>{footerLabels[x]}</span>)}</div></div>
   <label><input type="checkbox" checked={config.enabled} onChange={e=>setConfig({...config,enabled:e.target.checked})}/> Enable custom text</label>
   <p className="smallprint">Preview: {config.enabled?(config.announcement||"Default announcement"):"Default ANUSMITA announcement"}</p>
   <button className="button" type="submit" disabled={busy}>Save content</button>
   <button className="button small light" type="button" disabled={busy} onClick={()=>void load()}>Reload</button>
  </form>}
 </section>;
}
