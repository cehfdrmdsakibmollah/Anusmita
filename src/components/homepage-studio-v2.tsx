
"use client";
import {useEffect,useMemo,useState,useRef} from "react";
import {Home,ShoppingCart,Package,Boxes,Users,Settings,BookOpen,Image,Layers,LayoutGrid,Monitor,Tablet,Smartphone,Eye,EyeOff,Plus,Trash2,Copy,ArrowUp,ArrowDown,Undo2,Download,Upload,Search,Save,ExternalLink,ShieldCheck,CheckCircle2,AlertTriangle,Code2,SlidersHorizontal,Clock,FileText,ChevronDown,ChevronRight,Palette,PanelLeft,Sparkles,X} from "lucide-react";
import type {HomeBlock,HomeSection} from "@/lib/home-content";
import {blockSchema} from "@/lib/home-content";
import HomepageManager from "@/components/homepage-manager";
import "./homepage-studio-v2.css";

type Config={revision:number;blocks:HomeBlock[];sections:HomeSection[];saved:boolean};
type Device="desktop"|"tablet"|"mobile";
type Inspector="content"|"style"|"advanced";
type SectionMode="sections"|"blocks"|"layouts";
const labels:Record<HomeBlock["kind"],string>={hero:"Hero Banner",category:"Category Slider",promotion:"Flash Sale",editorial:"Editorial Banner",announcement:"Announcement Bar"};
const kinds:HomeBlock["kind"][]=["hero","category","promotion","editorial","announcement"];
const initial=(kind:HomeBlock["kind"],position:number):HomeBlock=>({id:crypto.randomUUID(),kind,position,title:kind==="hero"?"Your Natural Glow Starts Here":kind==="category"?"New Collection":"New "+labels[kind],subtitle:"Discover the ANUSMITA collection",label:"NEW ARRIVAL",imageUrl:"",href:"/shop",cta:"Shop Now",enabled:false,startsAt:null,endsAt:null});
const localTime=(iso:string|null)=>iso?new Date(new Date(iso).getTime()-new Date(iso).getTimezoneOffset()*60000).toISOString().slice(0,16):"";
function fileDownload(name:string,value:string){const blob=new Blob([value],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
function ListIcon({kind}:{kind:HomeBlock["kind"]}){return kind==="hero"?<Image size={16}/>:kind==="category"?<LayoutGrid size={16}/>:kind==="promotion"?<Clock size={16}/>:kind==="editorial"?<Layers size={16}/>:<FileText size={16}/>;}
export default function HomepageStudioV2(){
 const [config,setConfig]=useState<Config|null>(null),[selected,setSelected]=useState<string|null>(null);
 const [draft,setDraft]=useState<HomeBlock|null>(null),[device,setDevice]=useState<Device>("desktop"),[inspector,setInspector]=useState<Inspector>("content"),[mode,setMode]=useState<SectionMode>("sections");
 const [message,setMessage]=useState(""),[busy,setBusy]=useState(false),[query,setQuery]=useState(""),[showDraft,setShowDraft]=useState(true),[libraryOpen,setLibraryOpen]=useState(true),[legacyOpen,setLegacyOpen]=useState(false),[activePage,setActivePage]=useState("Homepage"),[confirmDelete,setConfirmDelete]=useState(false);
 const [shelfOpen,setShelfOpen]=useState(false);
 const importRef=useRef<HTMLInputElement|null>(null);
 const [showHelp,setShowHelp]=useState(false);
 async function load(){
  const res=await fetch("/api/admin/homepage",{cache:"no-store"});
  const data=await res.json();if(!res.ok)throw Error(data.error||"Unable to load homepage");
  setConfig(data);setDraft(null);setSelected(null);setMessage("");
 }
 useEffect(()=>{void load().catch(e=>setMessage(String(e)));},[]);
 const blocks=useMemo(()=>{if(!config)return [];return config.blocks.map(b=>draft?.id===b.id?draft:b).concat(draft&&!config.blocks.some(b=>b.id===draft.id)?[draft]:[]).sort((a,b)=>kinds.indexOf(a.kind)-kinds.indexOf(b.kind)||a.position-b.position);},[config,draft]);
 const visible=useMemo(()=>blocks.filter(b=>(showDraft||b.enabled)&&(!query||[b.title,b.kind,b.subtitle].join(" ").toLowerCase().includes(query.toLowerCase()))),[blocks,showDraft,query]);
 const active=selected?blocks.find(b=>b.id===selected)||null:null;
 const dirty=!!draft&&(JSON.stringify(config?.blocks.find(b=>b.id===draft.id))!==JSON.stringify(draft));
 const selectedKind=active?.kind||"hero";
 function choose(b:HomeBlock){if(dirty&&selected!==b.id&&!window.confirm("Discard unsaved changes to this card?"))return;setSelected(b.id);setDraft({...b});setInspector("content");setConfirmDelete(false);}
 function create(kind:HomeBlock["kind"]){if(dirty&&!window.confirm("Discard unsaved changes?"))return;const card=initial(kind,blocks.filter(b=>b.kind===kind).length);setSelected(card.id);setDraft(card);setInspector("content");setMode("sections");}
 function patch<K extends keyof HomeBlock>(key:K,value:HomeBlock[K]){if(!draft)return;setDraft({...draft,[key]:value});}
 async function operation(data:Record<string,unknown>){
  if(!config||busy)return false;setBusy(true);setMessage("");
  try{const res=await fetch("/api/admin/homepage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...data,revision:config.revision})});
   const body=await res.json();if(!res.ok)throw Error(body.error||"Save failed");
   setConfig(body);setDraft(null);setSelected(null);setMessage("Saved to the live homepage CMS. Refresh the storefront to see published items.");return true;
  }catch(e){setMessage("Error: "+(e instanceof Error?e.message:String(e)));return false;}finally{setBusy(false);}
 }
 async function save(){if(!draft||!config)return;const parsed=blockSchema.safeParse(draft);if(!parsed.success){setMessage("Validation: "+parsed.error.issues.map(i=>i.message).join("; "));return;}
  const existing=config.blocks.some(b=>b.id===draft.id);
  if(draft.enabled&&!window.confirm("This saves a published card to the public storefront immediately. Continue?"))return;
  await operation({action:existing?"edit":"add",block:parsed.data});
 }
 async function move(b:HomeBlock,direction:number){
  if(dirty){setMessage("Save or discard the current changes before reordering.");return;}
  const ordered=(config?.blocks||[]).filter(x=>x.kind===b.kind).sort((a,c)=>a.position-c.position);
  const index=ordered.findIndex(x=>x.id===b.id),to=index+direction;if(to<0||to>=ordered.length)return;
  [ordered[index],ordered[to]]=[ordered[to],ordered[index]];
  await operation({action:"reorder",kind:b.kind,ids:ordered.map(x=>x.id)});
 }
 function duplicate(){if(!active)return;const d={...active,id:crypto.randomUUID(),position:blocks.filter(b=>b.kind===active.kind).length,title:active.title+" (Copy)",enabled:false};setDraft(d);setSelected(d.id);setMessage("Duplicate is a draft preview until you save it.");}
 async function remove(){if(!active)return;if(!config?.blocks.some(b=>b.id===active.id)){setDraft(null);setSelected(null);setConfirmDelete(false);return;}if(!confirmDelete){setConfirmDelete(true);return;}await operation({action:"delete",id:active.id});setConfirmDelete(false);}
 function exportJson(){if(!config)return;fileDownload("anusmita-homepage-revision-"+config.revision+".json",JSON.stringify({revision:config.revision,blocks:config.blocks,sections:config.sections,exportedAt:new Date().toISOString()},null,2));setMessage("Homepage JSON backup exported. No changes made to the store.");}
 async function importJson(file:File){try{const raw=JSON.parse(await file.text());if(!Array.isArray(raw.blocks))throw Error("Expected JSON with a blocks array");const valid=raw.blocks.map((b:unknown)=>blockSchema.parse(b));if(!valid.length)throw Error("No compatible blocks");const example=valid[0] as HomeBlock;create(example.kind);setDraft({...example,id:crypto.randomUUID(),position:blocks.filter(b=>b.kind===example.kind).length,enabled:false});setMessage("Imported first compatible block as an unpublished preview. Review and explicitly save; no bulk overwrite was performed.");}catch(e){setMessage("Import error: "+String(e));}}
 const renderTile=(b:HomeBlock,type:string)=>(
  <button type="button" key={b.id} className={"avs-tile avs-"+type+(selected===b.id?" is-selected":"")+(b.enabled?"":" is-draft")} onClick={()=>choose(b)} aria-pressed={selected===b.id}>
   {b.imageUrl?<img src={b.imageUrl} alt="" loading={type==="hero"?"eager":"lazy"}/>:null}
   <span className="avs-tile-text"><small>{b.label||"ANUSMITA COLLECTION"}</small><strong>{b.title}</strong>{type!=="category"&&<span>{b.subtitle}</span>}{type!=="category"&&<em>{b.cta||"Explore"} →</em>}</span>
   <span className="avs-select-tag">{b.enabled?"Edit":"Draft"}</span>
  </button>);
 if(!config)return <div className="avs-loading" role="status">ANUSMITA Studio · {message||"Loading saved homepage content…"}</div>;
 return <div className="avs-root">
  <aside className="avs-global-nav">
   <div className="avs-wordmark">ANUSMITA<small>FASHION · JEWELLERY · BEAUTY</small></div>
   <div className="avs-nav-group"><b>Administration</b>
    {([["Overview",Home,"/admin/dashboard"],["Orders",ShoppingCart,"/admin/orders"],["Products",Package,"/admin/products/manage"],["Inventory",Boxes,"/admin/inventory"],["Customers",Users,"/admin/customers"],["Staff & Users",Users,"/admin/staff"]] as const).map(([label,I,url])=><a key={label} href={url}><I size={17}/>{label}</a>)}
   </div>
   <div className="avs-nav-group"><b>Content & Engagement</b><a className="active" href="/admin?tab=Homepage%20Studio"><Layers size={17}/>Homepage Studio</a><a href="/admin?tab=Custom%20Pages"><BookOpen size={17}/>Custom Pages</a><a href="/admin?tab=Integration%20Hub"><Settings size={17}/>Integration Hub</a></div>
   <div className="avs-nav-group"><b>Insights & Operations</b><a href="/admin?tab=Activity%20Logs"><FileText size={17}/>Audit Logs</a><a href="/admin?tab=SEO%20Manager"><Settings size={17}/>SEO Manager</a></div>
   <div className="avs-studio-card"><strong>♛ Enterprise Studio</strong><small>✓ Visual Page Builder</small><small>✓ Live CMS Data</small><small>✓ Revision Checks</small><small>✓ Role Permissions</small></div>
  </aside>
  <main className="avs-main">
   <div className="avs-topline"><span><Home size={16}/> Admin / <b>Homepage Studio & Visual Builder</b></span><label><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search sections, blocks or settings…"/></label><span className="avs-live"><span/> CMS Connected</span></div>
   <div className="avs-heading"><div className="avs-heading-title"><Layers size={35}/><div><h1>Homepage Studio & Visual Builder <span>♛ PRO</span></h1><p>Drag, design, customize and manage ANUSMITA storefront content.</p></div></div>
    <div className="avs-heading-actions"><button type="button" onClick={()=>setMessage("AI layout generation is not connected yet. Existing content remains unchanged.")}><Sparkles size={15}/> AI Generate</button><button onClick={()=>importRef.current?.click()}><Upload size={15}/> Import</button><input ref={importRef} hidden type="file" accept="application/json,.json" onChange={e=>{const file=e.target.files?.[0];if(file)void importJson(file);e.currentTarget.value="";}}/><button onClick={exportJson}><Download size={15}/> Export</button><button onClick={()=>setShowHelp(v=>!v)}><Settings size={15}/> Settings</button></div>
   </div>
   {showHelp&&<div className="avs-inline-notice">Live publishing is handled by the existing homepage API. This studio supports card editing, preview, JSON export, safe single-block import and ordering. A/B testing, AI generation, independent draft revisions and CDN purge are not yet configured.</div>}
   <div className="avs-stats">
    {[[Home,"Active Page","Homepage"],[Layers,"Sections",String(blocks.length)],[LayoutGrid,"Components",String(config.sections.length)],[AlertTriangle,"Draft Changes",dirty?"1 unsaved":"No unsaved edits"],[CheckCircle2,"Saved Revision",String(config.revision)],[ShieldCheck,"Permissions","Owner / Admin"],[Eye,"Preview","Responsive"],[CheckCircle2,"CMS Status",config.saved?"Connected":"Starter Layout"]].map(([I,label,value],i)=><div className="avs-stat" key={i}><span className="avs-stat-icon">{typeof I!=="string"&&<I size={22}/>}</span><div><small>{label as string}</small><strong>{value as string}</strong></div></div>)}
   </div>
   {message&&<div className={"avs-inline-notice"+(message.startsWith("Error")||message.startsWith("Validation")?" error":"")} role="status">{message}<button type="button" aria-label="Dismiss message" onClick={()=>setMessage("")}><X size={15}/></button></div>}
   <div className="avs-workspace">
    <section className="avs-leftpane"><div className="avs-tabs">{(["sections","blocks","layouts"] as const).map(x=><button key={x} className={mode===x?"active":""} onClick={()=>setMode(x)}>{x}</button>)}</div>
     {mode==="sections"?<><h3>Page Sections <small>(select to edit)</small></h3><div className="avs-section-list">
      {visible.map((b,i)=><div className={"avs-section-row"+(selected===b.id?" selected":"")} key={b.id}><button className="avs-row-main" onClick={()=>choose(b)}><span className="avs-handle">⠿</span><span>{i+1}</span><ListIcon kind={b.kind}/><span>{b.title}</span></button><button title="Toggle visibility in navigator" onClick={()=>setShowDraft(v=>!v)}>{b.enabled?<Eye size={15}/>:<EyeOff size={15}/>}</button><button title="Move section up" disabled={busy} onClick={()=>void move(b,-1)}><ArrowUp size={14}/></button><button title="Move section down" disabled={busy} onClick={()=>void move(b,1)}><ArrowDown size={14}/></button></div>)}
     </div><button className="avs-primary avs-add" onClick={()=>create("hero")}><Plus size={15}/> Add Section</button></>:<div className="avs-library-grid">{kinds.map(k=><button key={k} onClick={()=>create(k)}><ListIcon kind={k}/>{labels[k]}</button>)}</div>}
     <div className="avs-library"><button className="avs-library-heading" onClick={()=>setLibraryOpen(v=>!v)}>Section Library <small>(Pre-built)</small> {libraryOpen?<ChevronDown size={14}/>:<ChevronRight size={14}/>}</button>{libraryOpen&&<div className="avs-library-grid">{kinds.map(k=><button key={k} onClick={()=>create(k)}><ListIcon kind={k}/>{labels[k]}</button>)}<button onClick={()=>setShelfOpen(v=>!v)}><LayoutGrid size={16}/>Product Shelves</button></div>}</div>
     {shelfOpen&&<div className="avs-shelf-info">{config.sections.map(s=><div key={s.key}><strong>{s.title}</strong><span>{s.enabled?"Visible":"Hidden"} · {s.productIds.length} assigned SKUs</span></div>)}<p>Use the classic CMS below to manage published product SKUs.</p></div>}
    </section>
    <section className="avs-centerpane"><div className="avs-canvas-toolbar"><select aria-label="Page" value={activePage} onChange={e=>setActivePage(e.target.value)}><option>Homepage</option></select><span className="avs-device-controls">{([["desktop",Monitor],["tablet",Tablet],["mobile",Smartphone]] as const).map(([d,I])=><button title={d} key={d} className={device===d?"active":""} aria-pressed={device===d} onClick={()=>setDevice(d)}><I size={16}/></button>)}</span><span className="avs-width">{device==="desktop"?"1440":device==="tablet"?"768":"390"} px</span><button title="Discard unsaved edits" disabled={!dirty} onClick={()=>{setDraft(active&&config.blocks.find(b=>b.id===active.id)||null);setMessage("Unsaved edits discarded.");}}><Undo2 size={16}/></button><a target="_blank" rel="noreferrer" href="/"><ExternalLink size={15}/> Preview</a><button className="avs-view-toggle" onClick={()=>setShowDraft(v=>!v)}>{showDraft?"Drafts visible":"Published only"}</button></div>
     <div className="avs-canvas-back"><div className={"avs-site-canvas "+device}>
      <div className="avs-site-header"><div>ANUSMITA<small>FASHION · JEWELLERY · BEAUTY</small></div><nav>Home　 Shop⌄　 Bundles　 Deals　 Journal　 About　 Contact</nav><span>⌕　♙　♡　♧</span></div>
      <div className="avs-hero-collection">{blocks.filter(b=>b.kind==="hero"&&(showDraft||b.enabled)).map(b=>renderTile(b,"hero"))}</div>
      <div className="avs-benefits"><span>✧ 100% Authentic <small>Original Products</small></span><span>♧ Fast Delivery <small>All over Bangladesh</small></span><span>↻ Easy Return <small>7 Days Return Policy</small></span><span>♢ Secure Payment <small>Trusted Options</small></span></div>
      {blocks.some(b=>b.kind==="category")&&<div className="avs-shop-category"><h2>Shop by Category</h2><p>Explore your favorite beauty essentials</p><div className="avs-category-cards">{blocks.filter(b=>b.kind==="category"&&(showDraft||b.enabled)).map(b=>renderTile(b,"category"))}</div></div>}
      {blocks.filter(b=>b.kind==="promotion"&&(showDraft||b.enabled)).length>0&&<div className="avs-shop-promos"><h2>⚡ Flash Sale <small>Limited Time Offers</small></h2><div className="avs-promos">{blocks.filter(b=>b.kind==="promotion"&&(showDraft||b.enabled)).map(b=>renderTile(b,"promo"))}</div></div>}
      <div className="avs-shop-category"><h2>Featured collections</h2><p>Product data is connected through existing catalog modules</p><div className="avs-shelf-cards">{config.sections.filter(s=>s.enabled).map(s=><div key={s.key}><strong>{s.title}</strong><small>{s.subtitle}</small></div>)}</div></div>
      {blocks.filter(b=>b.kind==="editorial"&&(showDraft||b.enabled)).map(b=>renderTile(b,"editorial"))}
      <div className="avs-site-footer">ANUSMITA <small>Curated for you</small></div>
     </div></div>
    </section>
    <section className="avs-rightpane"><div className="avs-tabs">{(["content","style","advanced"] as const).map(x=><button key={x} onClick={()=>setInspector(x)} className={inspector===x?"active":""}>{x}</button>)}</div>
     {active&&draft?<div className="avs-inspector"><h3>{labels[selectedKind]} Settings</h3>
      {inspector==="content"?<><h4>⌄ Content</h4><label>Title<input maxLength={100} value={draft.title} onChange={e=>patch("title",e.target.value)}/></label><label>Subtitle<textarea maxLength={220} rows={3} value={draft.subtitle} onChange={e=>patch("subtitle",e.target.value)}/></label><label>Badge / eyebrow<input maxLength={65} value={draft.label} onChange={e=>patch("label",e.target.value)}/></label><div className="avs-form-two"><label>Primary Button<input maxLength={40} value={draft.cta} onChange={e=>patch("cta",e.target.value)}/></label><label>Destination<input value={draft.href} onChange={e=>patch("href",e.target.value)}/></label></div><h4>Media (Banner Image)</h4>{draft.imageUrl&&<img className="avs-media-thumb" src={draft.imageUrl} alt="Current banner"/>}<label>Approved image URL<input value={draft.imageUrl} onChange={e=>patch("imageUrl",e.target.value)} placeholder="/brand/categories/skincare.webp"/></label><p className="avs-hint">Use approved brand images or supported Cloudinary HTTPS images. Existing R2 upload workflows remain separate.</p></>:inspector==="style"?<><h4>Section appearance</h4><p className="avs-hint">Reference-based burgundy and blush styling is used in this editor. Rich typography, per-block CSS tokens, parallax, and custom animations require a separate validated schema before they can be saved safely.</p><label>Preview mode<select value={device} onChange={e=>setDevice(e.target.value as Device)}><option value="desktop">Desktop</option><option value="tablet">Tablet</option><option value="mobile">Mobile</option></select></label><div className="avs-color-samples"><span/><span/><span/><span/></div></>:<><h4>Publishing controls</h4><label className="avs-check"><input type="checkbox" checked={draft.enabled} onChange={e=>patch("enabled",e.target.checked)}/> Show this block on the public homepage</label><label>Display start<input type="datetime-local" value={localTime(draft.startsAt)} onChange={e=>patch("startsAt",e.target.value?new Date(e.target.value).toISOString():null)}/></label><label>Display end<input type="datetime-local" value={localTime(draft.endsAt)} onChange={e=>patch("endsAt",e.target.value?new Date(e.target.value).toISOString():null)}/></label><p className="avs-hint">The current API saves to the CMS immediately. Independent publishing approval, rollback and CDN purge are not implemented here.</p></>}
      <div className="avs-editor-actions"><button onClick={()=>void save()} className="avs-primary" disabled={!dirty||busy}><Save size={14}/> {busy?"Saving…":"Save Changes"}</button><button onClick={duplicate} title="Duplicate as unpublished draft"><Copy size={16}/></button><button onClick={()=>void remove()} title={confirmDelete?"Confirm delete":"Delete"} className={confirmDelete?"avs-danger":""}><Trash2 size={16}/>{confirmDelete?"Confirm":""}</button></div>
      {dirty&&<p className="avs-dirty"><AlertTriangle size={13}/> Unsaved preview changes</p>}
     </div>:<div className="avs-placeholder"><SlidersHorizontal size={27}/><strong>Select a section to edit</strong><p>Click any hero, category card or left-side section to open its settings.</p></div>}
    </section>
   </div>
   <div className="avs-bottom-tools"><strong>✧ Quick Tools:</strong><button onClick={()=>setInspector("style")}><Palette size={15}/> Theme Design</button><button onClick={()=>setInspector("style")}>Global Styles</button><button onClick={()=>setMessage("Custom CSS/JS injection is deliberately disabled until sandbox validation is added.")}><Code2 size={15}/> Custom CSS</button><button onClick={()=>setMessage("A/B testing needs verified traffic allocation and conversion tracking.")}>A/B Test</button><button onClick={()=>setMessage("Heatmaps need privacy-aware analytics integration before activation.")}>Heatmap</button><button onClick={()=>setMessage("Scheduled publishing needs a separate draft version and publish scheduler.")}>Schedule Publish</button><button onClick={exportJson}><Download size={15}/> Asset Backup</button><button onClick={()=>setLegacyOpen(v=>!v)}><PanelLeft size={15}/> {legacyOpen?"Hide":"Open"} Classic CMS</button><span className="avs-saved"><CheckCircle2 size={14}/> Revision {config.revision} saved</span></div>
   {legacyOpen&&<div className="avs-classic-note"><h3>Classic CMS controls</h3><p>Manage product shelf SKUs and original homepage cards using the existing editor. This is connected to the same CMS API. Reload the studio after changes to refresh its snapshot.</p><HomepageManager/><p><a href="/admin?tab=Categories">Open Categories Manager →</a> · <a href="/admin?tab=Products">Open Products Manager →</a></p></div>}
  </main>
 </div>;
}
