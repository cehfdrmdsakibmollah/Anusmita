
"use client";
import {useEffect,useMemo,useState} from "react";
import {ArrowDown,ArrowUp,ExternalLink,ImagePlus,Plus,RefreshCcw,Save,Trash2} from "lucide-react";
import type {HomeBlock,HomeSection} from "@/lib/home-content";
import {homeStarterBlocks,sectionKeys} from "@/lib/home-content";
type Config={revision:number;blocks:HomeBlock[];sections:HomeSection[];saved:boolean};
type CatalogProduct={_id:string;name:string;sku:string;active:boolean};
const kinds=["hero","category","promotion","editorial","announcement"] as const;
const labels:{[key:string]:string}={hero:"Hero Slides",category:"Category Cards",promotion:"Offer & Countdown",
 editorial:"Editorial Banners",announcement:"Announcement",new_arrivals:"New Arrivals",best_sellers:"Best Sellers",
 trending:"Trending",popular:"Popular",recommended:"Recommended"};
function newCard(kind:HomeBlock["kind"],count:number):HomeBlock{
 return {id:crypto.randomUUID(),kind,title:"New "+kind+" content",subtitle:"",label:"",
  imageUrl:"",href:"#shop",cta:"Explore now",enabled:false,position:count,startsAt:null,endsAt:null};
}
const cleanIso=(local:string)=>local?new Date(local).toISOString():null;
const localValue=(iso:string|null)=>iso?new Date(new Date(iso).getTime()-new Date(iso).getTimezoneOffset()*60000).toISOString().slice(0,16):"";
export default function HomepageManager(){
 const [config,setConfig]=useState<Config|null>(null),[kind,setKind]=useState<HomeBlock["kind"]>("hero"),
  [editing,setEditing]=useState<HomeBlock|null>(null),[draft,setDraft]=useState<HomeBlock|null>(null),
  [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[productSearch,setProductSearch]=useState(""),
  [products,setProducts]=useState<CatalogProduct[]>([]),[activeSection,setActiveSection]=useState<string>("new_arrivals"),
  [sectionDraft,setSectionDraft]=useState<HomeSection|null>(null);
 async function load(){
  const response=await fetch("/api/admin/homepage",{cache:"no-store"});
  const body=await response.json();
  if(!response.ok)throw new Error(body.error||"Could not load homepage CMS");
  setConfig(body);setEditing(null);setDraft(null);
 }
 useEffect(()=>{void load().catch(e=>setMessage("Error: "+String(e)));},[]);
 const selected=useMemo(()=>config?.blocks.filter(b=>b.kind===kind).sort((a,b)=>a.position-b.position)||[],[config,kind]);
 async function mutate(payload:Record<string,unknown>){
  if(!config||busy)return;
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/admin/homepage",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({...payload,revision:config.revision})});
   const body=await response.json();
   if(!response.ok)throw new Error(body.error||"Save failed");
   setConfig(body);setDraft(null);setEditing(null);setSectionDraft(null);
   setMessage("Saved. Changes are visible in the homepage after refreshing.");
  }catch(e){setMessage("Error: "+(e instanceof Error?e.message:String(e)));}
  finally{setBusy(false);}
 }
 function patch(field:keyof HomeBlock,value:string|boolean|number|null){
  if(!draft)return;setDraft({...draft,[field]:value});
 }
 function swap(idx:number,direction:number){
  const next=[...selected];const dest=idx+direction;
  if(dest<0||dest>=next.length)return;
  [next[idx],next[dest]]=[next[dest],next[idx]];
  void mutate({action:"reorder",kind,ids:next.map(x=>x.id)});
 }
 function editSection(key:string){
  setActiveSection(key);
  setSectionDraft(config?.sections.find(x=>x.key===key)||{
   key:key as HomeSection["key"],title:labels[key],subtitle:"",
   enabled:false,position:0,productIds:[],maxItems:8});
 }
 useEffect(()=>{
  if(!config)return;
  const found=config.sections.find(x=>x.key===activeSection);
  if(found)setSectionDraft({...found});
 },[config,activeSection]);
 async function lookup(){
  try{
   const resp=await fetch("/api/admin/products?q="+encodeURIComponent(productSearch)+"&page=1",{cache:"no-store"});
   const data=await resp.json();
   if(!resp.ok)throw new Error(data.error||"Search failed");
   setProducts(data.products||[]);
  }catch(e){setMessage("Error: "+String(e));}
 }
 if(!config)return <div className="adminCard"><h2>Homepage Studio</h2><p role="status">{message||"Loading homepage layout..."}</p></div>;
 return <div className="homeCms">
  <div className="adminCard homeCmsIntro">
   <div><p className="eyebrow">ANUSMITA · DESIGN CONTROL</p><h2>Homepage Studio</h2>
    <p>Build your storefront without changing code. Add or edit banners, categories, hero slides, countdown offers and featured-product sections. Draft content stays hidden.</p>
    <p className="smallprint">Saved revision {config.revision}. {config.saved?"Custom homepage is saved in the database.":"Starter layout will be saved automatically with your first edit."} Product prices and stock are always controlled separately by Products & Inventory.</p></div>
   <div className="homeCmsIntroActions"><a className="button small light" href="/" target="_blank" rel="noreferrer"><ExternalLink size={15}/> Preview homepage</a>
    <button type="button" className="button small light" onClick={()=>void load()}><RefreshCcw size={15}/> Refresh</button></div>
  </div>
  {message&&<p className={message.startsWith("Error")?"error":"success"} role="status">{message}</p>}
  <div className="homeCmsKinds" role="group" aria-label="Select homepage content type">
   {kinds.map(k=><button key={k} type="button" className={kind===k?"active":""} onClick={()=>{
    setKind(k);setEditing(null);setDraft(null);
   }}>{labels[k]} <span>{config.blocks.filter(b=>b.kind===k).length}</span></button>)}
  </div>
  <div className="adminCard homeCmsEditor">
   <div className="homeCmsListTitle"><div><h3>{labels[kind]}</h3><p className="smallprint">Use the arrows to adjust display order. Draft and expired items are hidden from customers.</p></div>
    <button className="button small" disabled={busy} onClick={()=>{
     const next=newCard(kind,selected.length);setEditing(null);setDraft(next);
    }}><Plus size={15}/> Add {kind}</button></div>
   <div className="homeCmsList">{selected.map((item,i)=><div key={item.id} className="homeCmsRow">
    <div className="homeCmsThumb">{item.imageUrl?<img src={item.imageUrl} alt=""/>:<ImagePlus size={22}/>}</div>
    <div className="homeCmsRowBody"><strong>{item.title}</strong><span>{item.label||item.kind} · {item.enabled?"Published":"Draft"}{item.endsAt?" · Expiry set":""}</span></div>
    <div className="homeCmsControls"><button type="button" aria-label={"Move "+item.title+" up"} disabled={busy||i===0} onClick={()=>swap(i,-1)}><ArrowUp size={15}/></button>
     <button type="button" aria-label={"Move "+item.title+" down"} disabled={busy||i===selected.length-1} onClick={()=>swap(i,1)}><ArrowDown size={15}/></button>
     <button type="button" className="button small light" onClick={()=>{setEditing(item);setDraft({...item});}}>Edit</button>
     <button type="button" aria-label={"Delete "+item.title} disabled={busy} onClick={()=>{
      if(confirm("Permanently delete this homepage card?"))void mutate({action:"delete",id:item.id});
     }}><Trash2 size={15}/></button></div>
   </div>)}</div>
   {selected.length===0&&<p className="notice">No {kind} content. Add a card to start.</p>}
   {draft&&<form className="homeCmsForm" onSubmit={e=>{e.preventDefault();void mutate({action:editing?"edit":"add",block:draft});}}>
    <h3>{editing?"Edit "+labels[kind]:"Create "+labels[kind]}</h3>
    <div className="formGrid">
     <div className="field"><label>Headline / name *</label><input required minLength={2} maxLength={100} value={draft.title} onChange={e=>patch("title",e.target.value)}/></div>
     <div className="field"><label>Eyebrow / badge</label><input maxLength={65} value={draft.label} onChange={e=>patch("label",e.target.value)} placeholder="THE ANUSMITA EDIT"/></div>
     <div className="field full"><label>Short description</label><textarea maxLength={220} rows={3} value={draft.subtitle} onChange={e=>patch("subtitle",e.target.value)}/></div>
     {kind!=="announcement"&&<div className="field full"><label>Hero / banner / card image HTTPS URL</label><input type="url" value={draft.imageUrl} onChange={e=>patch("imageUrl",e.target.value)}
      placeholder="https://res.cloudinary.com/oseohmxd/image/upload/…"/>
      <span className="smallprint">Cloudinary ANUSMITA images or images.unsplash.com only. Use the Cloudinary tab to upload real licensed images.</span></div>}
     <div className="field"><label>Button / click destination</label><input value={draft.href} onChange={e=>patch("href",e.target.value)} required placeholder="/shop?category=Beauty#shop"/></div>
     <div className="field"><label>Button label</label><input maxLength={40} value={draft.cta} onChange={e=>patch("cta",e.target.value)}/></div>
     {(kind==="promotion"||kind==="hero"||kind==="editorial")&&<>
      <div className="field"><label>Show from (optional)</label><input type="datetime-local" value={localValue(draft.startsAt)}
       onChange={e=>patch("startsAt",cleanIso(e.target.value))}/></div>
      <div className="field"><label>Expire at (optional, countdown on offers)</label><input type="datetime-local" value={localValue(draft.endsAt)}
       onChange={e=>patch("endsAt",cleanIso(e.target.value))}/></div>
     </>}
    </div>
    <p><label><input type="checkbox" checked={draft.enabled} onChange={e=>patch("enabled",e.target.checked)}/> Publish this {kind} to the homepage</label></p>
    {kind==="promotion"&&<p className="smallprint">Only announce a discount supported by actual product prices and a real promotion. Set an end date to enable countdown; expired offers disappear automatically.</p>}
    <div className="homeCmsFormButtons"><button className="button" type="submit" disabled={busy}><Save size={16}/> {busy?"Saving…":"Save "+kind}</button>
     <button className="button light" type="button" onClick={()=>{setDraft(null);setEditing(null);}}>Cancel</button></div>
   </form>}
  </div>
  <div className="adminCard homeCmsSections">
   <p className="eyebrow">MERCHANDISING</p><h2>Featured product shelves</h2>
   <p className="smallprint">Each shelf supports an editable title, publication status, order and selected products. New Arrivals can automatically list newest published SKUs. Other shelves need selected SKUs; no fabricated bestseller, trending or popularity data.</p>
   <div className="homeCmsKinds">{sectionKeys.map(k=><button type="button" key={k} className={activeSection===k?"active":""}
    onClick={()=>editSection(k)}>{labels[k]}</button>)}</div>
   {sectionDraft&&<form className="homeCmsForm" onSubmit={e=>{e.preventDefault();void mutate({action:"section",section:sectionDraft});}}>
    <div className="formGrid">
     <div className="field"><label>Section title</label><input minLength={2} maxLength={75} required value={sectionDraft.title} onChange={e=>setSectionDraft({...sectionDraft,title:e.target.value})}/></div>
     <div className="field"><label>Section order</label><input type="number" min={0} max={999} value={sectionDraft.position} onChange={e=>setSectionDraft({...sectionDraft,position:Number(e.target.value)})}/></div>
     <div className="field full"><label>Subtitle</label><input maxLength={150} value={sectionDraft.subtitle} onChange={e=>setSectionDraft({...sectionDraft,subtitle:e.target.value})}/></div>
     <div className="field"><label>Maximum items (1–16)</label><input type="number" min={1} max={16} value={sectionDraft.maxItems} onChange={e=>setSectionDraft({...sectionDraft,maxItems:Number(e.target.value)})}/></div>
    </div>
    <p><label><input type="checkbox" checked={sectionDraft.enabled} onChange={e=>setSectionDraft({...sectionDraft,enabled:e.target.checked})}/> Show this section</label></p>
    <h3>Assign published product SKUs</h3>
    <div className="homeCmsFind"><input aria-label="Search product SKUs" placeholder="Search product name or SKU" value={productSearch} onChange={e=>setProductSearch(e.target.value)}/>
      <button type="button" className="button small light" onClick={()=>void lookup()}>Find products</button></div>
    <div className="homeCmsProductResults">{products.map(p=><label key={p._id}>
     <input type="checkbox" disabled={!p.active} checked={sectionDraft.productIds.includes(p._id)}
      onChange={e=>setSectionDraft({...sectionDraft,productIds:e.target.checked?[...sectionDraft.productIds,p._id].slice(0,24):sectionDraft.productIds.filter(x=>x!==p._id)})}/>
      {p.name} <small>{p.sku} {p.active?"":"(draft)"}</small></label>)}</div>
    <p className="smallprint">{sectionDraft.productIds.length} product(s) selected. Unpublished products never appear on the public site, even if assigned here.</p>
    <div className="homeCmsFormButtons"><button className="button" type="submit" disabled={busy}><Save size={16}/> Save product section</button></div>
   </form>}
  </div>
 </div>;
}
