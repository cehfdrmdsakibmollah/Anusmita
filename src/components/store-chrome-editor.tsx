"use client";
import {useEffect,useState} from "react";
import {defaultNavLinks,defaultShopLinks,defaultCareLinks,type ChromeLink} from "@/lib/store-chrome-links";
type Config={announcement:string;footerNote:string;enabled:boolean;revision:number;headerOrder:string[];footerOrder:string[];navLinks:ChromeLink[];footerShopLinks:ChromeLink[];footerCareLinks:ChromeLink[]};
const headerLabels:Record<string,string>={logo:"Brand logo",navigation:"Main navigation",search:"Product search",tools:"Account, bag & mobile menu"};
const footerLabels:Record<string,string>={brand:"Brand introduction",shop:"Shop links",care:"Customer care links"};
export default function StoreChromeEditor(){
 const [drag,setDrag]=useState<{part:"headerOrder"|"footerOrder";id:string}|null>(null);
 const [config,setConfig]=useState<Config|null>(null),[saved,setSaved]=useState<Config|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const dirty=!!config&&!!saved&&JSON.stringify(config)!==JSON.stringify(saved);
 async function load(){
  setLoading(true);setNotice("");
  try{
   const res=await fetch("/api/admin/store-chrome",{cache:"no-store"}),body=await res.json();
   if(!res.ok)throw new Error(body.error||"Unable to load settings");
   const parsed:Config={announcement:String(body.announcement||""),footerNote:String(body.footerNote||""),enabled:!!body.enabled,revision:Number(body.revision||0),headerOrder:body.headerOrder,footerOrder:body.footerOrder,navLinks:body.navLinks||defaultNavLinks,footerShopLinks:body.footerShopLinks||defaultShopLinks,footerCareLinks:body.footerCareLinks||defaultCareLinks};
   setConfig(parsed);setSaved(structuredClone(parsed));
  }catch(e){setNotice("Error: "+(e instanceof Error?e.message:"Load failed"));}
  finally{setLoading(false);}
 }
 useEffect(()=>{void load();},[]);
 useEffect(()=>{if(!dirty)return;const guard=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};window.addEventListener("beforeunload",guard);return()=>window.removeEventListener("beforeunload",guard);},[dirty]);
 function move(part:"headerOrder"|"footerOrder",from:string,to:string){if(!config||from===to)return;const order=[...config[part]],source=order.indexOf(from),destination=order.indexOf(to);if(source<0||destination<0)return;order.splice(source,1);order.splice(destination,0,from);setConfig({...config,[part]:order});}
 function upDown(part:"headerOrder"|"footerOrder",id:string,delta:number){if(!config)return;const order=config[part],index=order.indexOf(id),target=order[index+delta];if(target)move(part,id,target);}
 function linkGroup(part:"navLinks"|"footerShopLinks"|"footerCareLinks",heading:string){
  if(!config)return null;
  const items=config[part];
  const patchLinks=(next:ChromeLink[])=>setConfig(current=>current?{...current,[part]:next}:current);
  const moveLink=(index:number,delta:number)=>{
   const target=index+delta;if(target<0||target>=items.length)return;
   const next=[...items];[next[index],next[target]]=[next[target],next[index]];patchLinks(next);
  };
  return <fieldset className="adminCard"><legend><strong>{heading}</strong></legend>
   <p className="smallprint">Edit internal URLs and labels. Up to 12 links. Empty lists are allowed; essential account, cart and legal links are separate.</p>
   {items.map((item,index)=><div key={item.id} style={{display:"flex",gap:7,alignItems:"end",flexWrap:"wrap",borderBottom:"1px solid #edd5df",padding:"9px 0"}}>
    <label style={{flex:"1 1 140px",fontSize:11}}>Label<input aria-label={heading+" link "+(index+1)+" label"} maxLength={50} value={item.label} onChange={e=>patchLinks(items.map((x,i)=>i===index?{...x,label:e.target.value}:x))}/></label>
    <label style={{flex:"2 1 170px",fontSize:11}}>Destination<input aria-label={heading+" link "+(index+1)+" URL"} maxLength={250} value={item.href} onChange={e=>patchLinks(items.map((x,i)=>i===index?{...x,href:e.target.value}:x))}/></label>
    <button type="button" disabled={index===0||busy} aria-label={"Move "+item.label+" up"} onClick={()=>moveLink(index,-1)}>↑</button>
    <button type="button" disabled={index===items.length-1||busy} aria-label={"Move "+item.label+" down"} onClick={()=>moveLink(index,1)}>↓</button>
    <button type="button" disabled={busy} aria-label={"Remove "+item.label} onClick={()=>{if(window.confirm("Remove "+item.label+" from the editorial link list?"))patchLinks(items.filter(x=>x.id!==item.id));}}>Remove</button>
   </div>)}
   <button type="button" disabled={busy||items.length>=12} onClick={()=>patchLinks([...items,{id:crypto.randomUUID().slice(0,8),label:"New link",href:"/shop"}])}>+ Add link</button>
  </fieldset>;
 }
 function sectionList(part:"headerOrder"|"footerOrder",labels:Record<string,string>){if(!config)return null;return <div className="adminCard"><h3>{part==="headerOrder"?"Header sections":"Footer sections"}</h3><p className="smallprint">Drag a section over another section to reorder it, or use the accessible arrow buttons. Essential navigation and legal links cannot be deleted.</p><div style={{display:"grid",gap:8}}>{config[part].map((id,i)=><div key={id} draggable onDragStart={()=>setDrag({part,id})} onDragEnd={()=>setDrag(null)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(drag?.part===part)move(part,drag.id,id);setDrag(null);}} style={{display:"flex",gap:8,alignItems:"center",padding:12,border:"1px solid #d6c4c4",borderRadius:10,cursor:"grab"}}><span aria-hidden="true">☰</span><strong style={{flex:1}}>{labels[id]||id}</strong><button type="button" aria-label={"Move "+labels[id]+" earlier"} disabled={i===0} className="button small light" onClick={()=>upDown(part,id,-1)}>↑</button><button type="button" aria-label={"Move "+labels[id]+" later"} disabled={i===config[part].length-1} className="button small light" onClick={()=>upDown(part,id,1)}>↓</button></div>)}</div></div>;}
 async function save(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!config||busy||!dirty)return;
  if(!window.confirm("Publish header/footer changes to all storefront pages? Existing navigation and commerce logic will be preserved."))return;
  setBusy(true);setNotice("");
  try{
   const res=await fetch("/api/admin/store-chrome",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(config)});
   const body=await res.json();if(!res.ok)throw new Error(body.error||"Unable to save");
   const next={...config,revision:Number(body.revision)};setConfig(next);setSaved(structuredClone(next));setNotice("Published revision "+body.revision+". Refresh the public storefront to verify content.");
  }catch(e){setNotice("Error: "+(e instanceof Error?e.message:"Save failed"));}
  finally{setBusy(false);}
 }
 return <section className="adminCard">
  <h2>Visual Header & Footer Builder</h2>
  <p className="smallprint">Reorder built-in sections and manage editorial navigation/footer links. Account, cart, search, logo and legal links stay protected. Changes go public only when enabled and published. No custom HTML or scripts.</p>
  {loading&&<p role="status">Loading settings…</p>}
  {notice&&<p role="status">{notice}</p>}
  {config&&<form onSubmit={e=>void save(e)} className="adminForm">
   <div className="field"><label htmlFor="announcementText">Announcement text</label>
    <input id="announcementText" maxLength={180} value={config.announcement} onChange={e=>setConfig({...config,announcement:e.target.value})}/></div>
   <div className="field"><label htmlFor="footerText">Footer brand subtitle</label>
    <input id="footerText" maxLength={240} value={config.footerNote} onChange={e=>setConfig({...config,footerNote:e.target.value})}/></div>
   {sectionList("headerOrder",headerLabels)}
   {sectionList("footerOrder",footerLabels)}
   {linkGroup("navLinks","Main navigation links")}
   {linkGroup("footerShopLinks","Footer shop links")}
   {linkGroup("footerCareLinks","Footer customer-care links")}
   <div className="adminCard"><h3>Live draft preview</h3><p className="smallprint">Header arrangement</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{config.headerOrder.map(x=><span key={x} style={{padding:8,border:"1px solid #caa",borderRadius:6}}>{headerLabels[x]}</span>)}</div><p className="smallprint">Footer arrangement</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{config.footerOrder.map(x=><span key={x} style={{padding:8,border:"1px solid #caa",borderRadius:6}}>{footerLabels[x]}</span>)}</div></div>
   <label><input type="checkbox" checked={config.enabled} onChange={e=>setConfig({...config,enabled:e.target.checked})}/> Enable custom text</label>
   <p className="smallprint">Preview: {config.enabled?(config.announcement||"Default announcement"):"Default ANUSMITA announcement"}</p>
   <button className="button" type="submit" disabled={busy||!dirty}>{busy?"Saving…":"Publish Header/Footer"}</button>
   <button className="button small light" type="button" disabled={busy||!dirty} onClick={()=>{if(!window.confirm("Discard unsaved header/footer edits?"))return;if(saved)setConfig(structuredClone(saved));}}>Discard changes</button>
   <button className="button small light" type="button" disabled={busy} onClick={()=>{if(dirty&&!window.confirm("Reload saved header/footer settings and discard unsaved edits?"))return;void load();}}>Reload</button>
   <p className="smallprint" role="status">{dirty?"Unsaved header/footer edits.":config.enabled?"Custom header/footer configuration enabled.":"Using default storefront header/footer."} · Revision {config.revision}</p>
  </form>}
 </section>;
}
