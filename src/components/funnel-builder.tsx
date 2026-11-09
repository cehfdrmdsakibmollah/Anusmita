"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {Archive,ArrowDown,ArrowUp,Check,Copy,Download,Eye,FilePlus2,GripVertical,Image as ImageIcon,Layers3,Monitor,Plus,RefreshCw,Save,Smartphone,Tablet,Trash2,Upload,Undo2} from "lucide-react";
import type {z} from "zod";
import {funnelKinds,funnelWrite,funnelContent,initialFunnelBlock,type funnelBlock,type funnelStyle} from "@/lib/funnel-pages";
import {FunnelBlocks} from "./funnel-blocks";
import "./funnel-builder.css";
type Block=z.infer<typeof funnelBlock>;
type Content=z.infer<typeof funnelContent>;
type Style=z.infer<typeof funnelStyle>;
type Funnel={id?:string;slug:string;revision:number;published:boolean;archived:boolean;hasDraft?:boolean;updatedAt?:string;publishedAt?:string|null}&Content;
const empty=():Funnel=>({slug:"",revision:0,published:false,archived:false,title:"",description:"",seoTitle:"",noIndex:false,blocks:[initialFunnelBlock("hero") as Block,initialFunnelBlock("features") as Block]});
const names:Record<Block["kind"],string>={hero:"Hero Banner",heading:"Heading",paragraph:"Paragraph",image:"Image",button:"CTA Button",features:"Feature Grid",faq:"FAQ Accordion",divider:"Divider",countdown:"Countdown Timer",trust:"Trust / Benefit Cards",coupon:"Coupon Display"};
const slugify=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80);
const getContent=(p:Funnel):Content=>({title:p.title,description:p.description,seoTitle:p.seoTitle,noIndex:p.noIndex,blocks:p.blocks});
const numbered=["width","minHeight","fontSize","borderRadius","padding","margin","gap"] as const;
const colored=["backgroundColor","color"] as const;
export default function FunnelBuilder(){
 const upload=useRef<HTMLInputElement>(null),dragged=useRef<number|null>(null);
 const [pages,setPages]=useState<Funnel[]>([]),[page,setPage]=useState<Funnel|null>(null);
 const [saved,setSaved]=useState(""),[selected,setSelected]=useState<string|null>(null),[rightTab,setRightTab]=useState<"content"|"style"|"seo">("content");
 const [viewport,setViewport]=useState<"desktop"|"tablet"|"mobile">("desktop"),[notice,setNotice]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[search,setSearch]=useState("");
 const dirty=!!page&&JSON.stringify(page)!==saved;
 const active=page?.blocks.find(b=>b.id===selected);
 const filtered=useMemo(()=>pages.filter(x=>(x.title+" "+x.slug).toLowerCase().includes(search.toLowerCase())),[pages,search]);
 async function load(){
  const response=await fetch("/api/admin/funnel-pages",{cache:"no-store"}),json=await response.json();
  if(!response.ok)throw Error(json.error||"Unable to load campaign pages");
  setPages(json.pages||[]);return json.pages as Funnel[];
 }
 useEffect(()=>{void load().catch(e=>setError(String(e)));},[]);
 useEffect(()=>{if(!dirty)return;const before=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};window.addEventListener("beforeunload",before);return()=>window.removeEventListener("beforeunload",before);},[dirty]);
 function choose(next:Funnel){
  if(dirty&&!window.confirm("Discard unsaved campaign edits?"))return;
  const copy=structuredClone(next);setPage(copy);setSaved(JSON.stringify(copy));setSelected(copy.blocks[0]?.id||null);setNotice("");setError("");
 }
 function create(){
  if(dirty&&!window.confirm("Discard unsaved changes?"))return;
  const next=empty();setPage(next);setSaved(JSON.stringify(next));setSelected(next.blocks[0].id);setNotice("");setError("");
 }
 function patch(values:Partial<Funnel>){setPage(p=>p?{...p,...values}:p);}
 function updateBlock(id:string,values:Partial<Block>){
  setPage(p=>p?{...p,blocks:p.blocks.map(b=>b.id===id?{...b,...values}:b)}:p);
 }
 function updateStyle(id:string,key:keyof Style,value:string){
  setPage(p=>p?{...p,blocks:p.blocks.map(b=>b.id===id?{...b,style:{...b.style,[key]:value}}:b)}:p);
 }
 function add(kind:Block["kind"]){
  if(!page||page.blocks.length>=50)return;
  const block=initialFunnelBlock(kind) as Block;
  patch({blocks:[...page.blocks,block]});setSelected(block.id);setRightTab("content");
 }
 function move(from:number,to:number){
  if(!page||from<0||to<0||from>=page.blocks.length||to>=page.blocks.length||from===to)return;
  const list=[...page.blocks];const [item]=list.splice(from,1);list.splice(to,0,item);patch({blocks:list});
 }
 function duplicate(id:string){
  if(!page||page.blocks.length>=50)return;
  const index=page.blocks.findIndex(b=>b.id===id);if(index<0)return;
  const clone={...structuredClone(page.blocks[index]),id:crypto.randomUUID()};const blocks=[...page.blocks];blocks.splice(index+1,0,clone);patch({blocks});setSelected(clone.id);
 }
 function remove(id:string){
  if(!page||page.blocks.length===1)return;
  patch({blocks:page.blocks.filter(b=>b.id!==id)});if(selected===id)setSelected(page.blocks.find(b=>b.id!==id)?.id||null);
 }
 function clonePage(){
  if(!page)return;
  const next={...structuredClone(page),id:undefined,title:page.title+" (Copy)",slug:"",revision:0,published:false,archived:false,hasDraft:false,
   blocks:page.blocks.map(b=>({...b,id:crypto.randomUUID()}))};
  setPage(next);setSelected(next.blocks[0].id);setSaved(JSON.stringify(next));setNotice("Campaign cloned locally. Enter a new unique slug, then save as draft.");
 }
 async function save(mode:"draft"|"publish"|"archive"|"restore"){
  if(!page||busy)return;
  const payload=funnelWrite.safeParse({slug:page.slug,revision:page.revision,mode,content:getContent(page)});
  if(!payload.success){setError("Invalid title, slug, CSS, image or block data. Check required fields before saving.");return;}
  if(mode==="publish"&&!window.confirm("Publish /funnel/"+page.slug+" publicly?"))return;
  if(mode==="archive"&&!window.confirm("Archive this funnel page and remove it from the public storefront?"))return;
  setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/admin/funnel-pages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload.data)});
   const j=await r.json();if(!r.ok)throw Error(j.error||"Unable to save funnel");
   const updated={...page,revision:j.revision,published:j.published,archived:j.archived,hasDraft:mode==="draft"&&page.published};
   setPage(updated);setSaved(JSON.stringify(updated));await load();
   setNotice(mode==="publish"?"Campaign published to /funnel/"+page.slug:mode==="archive"?"Campaign archived safely":mode==="restore"?"Campaign restored to draft":"Funnel draft saved; existing published version remains unchanged.");
  }catch(e){setError(e instanceof Error?e.message:"Save failed");}
  finally{setBusy(false);}
 }
 function exportPage(){
  if(!page)return;
  const blob=new Blob([JSON.stringify({kind:"anusmita.funnel-page",version:1,content:getContent(page)},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=(page.slug||"new-funnel")+".json";a.click();window.setTimeout(()=>URL.revokeObjectURL(url),10000);
 }
 async function importPage(file?:File){
  if(!file)return;
  try{
   if(file.size>1024*1024)throw Error("Maximum upload size is 1 MB");
   const parsed=JSON.parse(await file.text()),validated=funnelContent.parse(parsed?.kind==="anusmita.funnel-page"&&parsed?.version===1?parsed.content:null);
   if(dirty&&!window.confirm("Discard unsaved work to import?"))return;
   const next:{[K in keyof Funnel]:Funnel[K]}={...empty(),...validated,blocks:validated.blocks.map(b=>({...b,id:crypto.randomUUID()}))};
   setPage(next);setSaved(JSON.stringify(next));setSelected(next.blocks[0].id);setNotice("JSON imported as a new draft. Choose a unique slug.");
  }catch(e){setError("Import rejected: "+(e instanceof Error?e.message:String(e)));}
  finally{if(upload.current)upload.current.value="";}
 }
 function setItem(index:number,key:"title"|"body",value:string){
  if(!active)return;updateBlock(active.id,{items:active.items.map((it,i)=>i===index?{...it,[key]:value}:it)});
 }
 return <div className="anFB">
  <header className="anFBTop"><div><span>ANUSMITA · ENTERPRISE CAMPAIGN STUDIO</span><h1>Custom Pages & Funnel Builder</h1><p>Visual blocks · Isolated CSS · Draft & Publish · Conversion-ready landing pages</p></div><div className="anFBTopActions"><Link href="/admin/custom-pages">Policy Pages</Link><button type="button" onClick={create}><Plus size={16}/> New Funnel</button></div></header>
  <nav className="anFBRibbon"><span><Layers3 size={17}/> Funnel Studio</span><button onClick={clonePage} disabled={!page}><Copy size={15}/> Duplicate</button><button onClick={exportPage} disabled={!page}><Download size={15}/> Export JSON</button><button onClick={()=>upload.current?.click()}><Upload size={15}/> Import JSON</button><input ref={upload} hidden type="file" accept=".json,application/json" onChange={e=>void importPage(e.target.files?.[0])}/><button onClick={()=>void load().catch(e=>setError(String(e)))}><RefreshCw size={15}/> Refresh List</button></nav>
  {error&&<p role="alert" className="anFBError">{error}</p>}{notice&&<p role="status" className="anFBNotice">{notice}</p>}
  <div className="anFBGrid">
   <aside className="anFBLeft"><div className="anFBSectionHeading"><strong>Campaign Pages</strong><span>{pages.length}</span></div><input className="anFBSearch" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search campaigns…"/><div className="anFBPageList">{filtered.map(p=><button key={p.slug} onClick={()=>choose(p)} className={page?.slug===p.slug?"active":""}><span><strong>{p.title}</strong><small>/funnel/{p.slug}</small></span><em>{p.archived?"Archived":p.published?"Live":"Draft"}</em></button>)}{!filtered.length&&<p>No saved funnels yet</p>}</div>
    <div className="anFBSectionHeading"><strong>Elements Library</strong><span>{funnelKinds.length}</span></div><div className="anFBElements">{funnelKinds.map(kind=><button key={kind} disabled={!page||page.blocks.length>=50} onClick={()=>add(kind)}><Plus size={14}/>{names[kind]}</button>)}</div>
    <small>Only safe visual blocks. Arbitrary scripts and customer data collection are disabled.</small>
   </aside>
   <section className="anFBCenter">{page?<><div className="anFBToolbar"><div><input className="anFBPageTitle" aria-label="Funnel title" value={page.title} maxLength={100} placeholder="Campaign title" onChange={e=>patch({title:e.target.value,slug:page.revision? page.slug:slugify(e.target.value)})}/><small>/funnel/{page.slug||"new-campaign"} · Rev {page.revision} · {page.archived?"Archived":page.published?"Published":"Draft"}{page.hasDraft?" · Unpublished changes":""}</small></div>
    <div className="anFBToolbarRight"><button aria-label="Desktop preview" className={viewport==="desktop"?"active":""} onClick={()=>setViewport("desktop")}><Monitor size={16}/></button><button aria-label="Tablet preview" className={viewport==="tablet"?"active":""} onClick={()=>setViewport("tablet")}><Tablet size={16}/></button><button aria-label="Mobile preview" className={viewport==="mobile"?"active":""} onClick={()=>setViewport("mobile")}><Smartphone size={16}/></button></div></div>
    <div className="anFBActionbar"><button onClick={()=>void save("draft")} disabled={busy}><Save size={15}/> Save Draft</button><button className="primary" onClick={()=>void save("publish")} disabled={busy||page.archived}><Check size={15}/> Publish</button>{page.published&&!page.archived&&<Link href={"/funnel/"+page.slug} target="_blank"><Eye size={15}/> Live</Link>}<span>{dirty?"Unsaved changes":"All changes saved"}</span></div>
    <div className={"anFBCanvasStage "+viewport}><div className="anFunnelRoot anFBPreviewRoot"><div className="anFunnelPublicHeader"><span className="anFunnelLogo">ANUSMITA</span><span>Discover Your Glow</span></div><FunnelBlocks blocks={page.blocks} selected={selected} onPick={setSelected}/></div></div>
    <div className="anFBOutline"><strong>Layers ({page.blocks.length})</strong>{page.blocks.map((b,i)=><div draggable key={b.id} onDragStart={()=>{dragged.current=i}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(dragged.current!==null)move(dragged.current,i);dragged.current=null}} className={selected===b.id?"selected":""}><button onClick={()=>setSelected(b.id)}><GripVertical size={15}/>{i+1}. {names[b.kind]}</button><button title="Move up" disabled={i===0} onClick={()=>move(i,i-1)}><ArrowUp size={14}/></button><button title="Move down" disabled={i===page.blocks.length-1} onClick={()=>move(i,i+1)}><ArrowDown size={14}/></button><button title="Duplicate" onClick={()=>duplicate(b.id)}><Copy size={14}/></button><button title="Delete" disabled={page.blocks.length===1} onClick={()=>remove(b.id)}><Trash2 size={14}/></button></div>)}</div>
   </>:<div className="anFBEmpty"><ImageIcon size={38}/><h2>Build your next high-converting page</h2><p>Select a saved campaign or create a funnel to start adding sections.</p><button onClick={create}><Plus size={16}/> Create Funnel</button></div>}</section>
   <aside className="anFBRight">{page?<><div className="anFBInspectorTabs"><button className={rightTab==="content"?"active":""} onClick={()=>setRightTab("content")}>Content</button><button className={rightTab==="style"?"active":""} onClick={()=>setRightTab("style")}>Style</button><button className={rightTab==="seo"?"active":""} onClick={()=>setRightTab("seo")}>SEO</button></div>
    {rightTab==="seo"?<div className="anFBFields"><h3>Campaign Settings</h3><label>URL Slug<input disabled={page.revision>0} value={page.slug} onChange={e=>patch({slug:e.target.value.toLowerCase()})} maxLength={80}/></label><label>Meta Title<input value={page.seoTitle} maxLength={70} onChange={e=>patch({seoTitle:e.target.value})}/></label><label>Meta Description<textarea value={page.description} maxLength={160} onChange={e=>patch({description:e.target.value})}/></label><label className="anFBCheck"><input type="checkbox" checked={page.noIndex} onChange={e=>patch({noIndex:e.target.checked})}/> NoIndex</label><button onClick={()=>void save(page.archived?"restore":"archive")} disabled={busy}>{page.archived?<Undo2 size={15}/>:<Archive size={15}/>} {page.archived?"Restore as Draft":"Archive Page"}</button><p>Archive hides published content without deleting saved records.</p></div>:
     active?<div className="anFBFields"><h3>{names[active.kind]}</h3>
      {rightTab==="content"?<>
       <label>Block Type<select value={active.kind} onChange={e=>updateBlock(active.id,{kind:e.target.value as Block["kind"]})}>{funnelKinds.map(k=><option key={k} value={k}>{names[k]}</option>)}</select></label>
       <label>Title<input maxLength={220} value={active.title} onChange={e=>updateBlock(active.id,{title:e.target.value})}/></label>
       <label>Body<textarea maxLength={2400} rows={4} value={active.body} onChange={e=>updateBlock(active.id,{body:e.target.value})}/></label>
       {["hero","image"].includes(active.kind)&&<label>Image URL (HTTPS or /path)<input value={active.imageUrl} onChange={e=>updateBlock(active.id,{imageUrl:e.target.value})} placeholder="https://…"/></label>}
       {["hero","button","coupon"].includes(active.kind)&&<><label>Button / Coupon Label<input value={active.buttonLabel} onChange={e=>updateBlock(active.id,{buttonLabel:e.target.value})}/></label><label>Destination URL<input value={active.buttonUrl} onChange={e=>updateBlock(active.id,{buttonUrl:e.target.value})} placeholder="/shop"/></label></>}
       {active.kind==="countdown"&&<label>Expiration (ISO datetime)<input type="datetime-local" value={active.expiresAt.slice(0,16)} onChange={e=>updateBlock(active.id,{expiresAt:e.target.value?new Date(e.target.value).toISOString():""})}/></label>}
       {["features","faq","trust"].includes(active.kind)&&<><strong>Cards / Accordion Items</strong>{active.items.map((it,i)=><div key={i} className="anFBItem"><label>Title<input value={it.title} maxLength={140} onChange={e=>setItem(i,"title",e.target.value)}/></label><label>Description<textarea value={it.body} maxLength={500} onChange={e=>setItem(i,"body",e.target.value)}/></label><button onClick={()=>updateBlock(active.id,{items:active.items.filter((_,j)=>j!==i)})}><Trash2 size={14}/> Remove</button></div>)}<button disabled={active.items.length>=12} onClick={()=>updateBlock(active.id,{items:[...active.items,{title:"New item",body:"Description"}]})}><Plus size={14}/> Add Item</button></>}
       </>:<><p>Allowlisted CSS only. Every value affects this selected block, not global site elements.</p>
        {numbered.map(key=><label key={key}>{key}<input value={active.style[key]||""} placeholder={key==="width"?"100%":key==="padding"?"24px":"auto"} onChange={e=>updateStyle(active.id,key,e.target.value)}/></label>)}
        {colored.map(key=><label key={key}>{key}<input value={active.style[key]||""} placeholder="#ffffff" onChange={e=>updateStyle(active.id,key,e.target.value)}/></label>)}
        <label>Font Weight<select value={active.style.fontWeight||"400"} onChange={e=>updateStyle(active.id,"fontWeight",e.target.value)}>{["400","500","600","700","800"].map(k=><option key={k} value={k}>{k}</option>)}</select></label>
        <label>Text Align<select value={active.style.textAlign||"left"} onChange={e=>updateStyle(active.id,"textAlign",e.target.value)}>{["left","center","right"].map(k=><option key={k} value={k}>{k}</option>)}</select></label>
        <label>Layout<select value={active.style.display||"block"} onChange={e=>updateStyle(active.id,"display",e.target.value)}>{["block","flex","grid"].map(k=><option key={k} value={k}>{k}</option>)}</select></label>
        <label>Flex Direction<select value={active.style.flexDirection||"row"} onChange={e=>updateStyle(active.id,"flexDirection",e.target.value)}>{["row","column"].map(k=><option key={k} value={k}>{k}</option>)}</select></label>
        <label>Grid Columns<select value={active.style.gridColumns||"3"} onChange={e=>updateStyle(active.id,"gridColumns",e.target.value)}>{["1","2","3","4"].map(k=><option key={k} value={k}>{k} columns</option>)}</select></label>
        <label>Shadow<select value={active.style.boxShadow||"none"} onChange={e=>updateStyle(active.id,"boxShadow",e.target.value)}>{["none","soft","medium","strong"].map(k=><option key={k} value={k}>{k}</option>)}</select></label>
       </>}
     </div>:<div className="anFBFields"><p>Select a block from the canvas to edit its content or CSS.</p></div>}
   </>:<div className="anFBFields"><p>Create or select a funnel to begin.</p></div>}</aside>
  </div>
 </div>;
}
