"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {Archive,ArrowDown,ArrowUp,Check,Copy,Download,Eye,FilePlus2,GripVertical,Image as ImageIcon,Layers3,Monitor,Plus,RefreshCw,Save,Smartphone,Tablet,Trash2,Upload,Undo2,Type,Heading1,MousePointer2,RectangleHorizontal,Minus,Clock3,Star,Package,Settings2,ChartNoAxesColumnIncreasing,Search,ChevronDown,ChevronUp,Maximize2,LayoutTemplate,Rows3,PanelRight,RotateCcw,RotateCw,Crown} from "lucide-react";
import type {z} from "zod";
import {funnelKinds,funnelWrite,funnelContent,initialFunnelBlock,initialFunnelSlide,funnelBlock,type funnelStyle} from "@/lib/funnel-pages";
import {FunnelBlocks} from "./funnel-blocks";
import "./funnel-builder.css";
type Block=z.infer<typeof funnelBlock>;
type Content=z.infer<typeof funnelContent>;
type Style=z.infer<typeof funnelStyle>;
type Funnel={id?:string;slug:string;revision:number;published:boolean;archived:boolean;hasDraft?:boolean;updatedAt?:string;publishedAt?:string|null}&Content;
const empty=():Funnel=>({slug:"new-campaign-"+crypto.randomUUID().slice(0,8),revision:0,published:false,archived:false,title:"New Campaign",description:"",seoTitle:"",noIndex:false,endsAt:"",blocks:[initialFunnelBlock("hero") as Block,initialFunnelBlock("features") as Block]});
const names:Record<Block["kind"],string>={hero:"Hero Banner",banner:"Editable Banner",slider:"Auto Image Slider",carousel:"Image Carousel",heading:"Heading",paragraph:"Paragraph",image:"Image",button:"CTA Button",features:"Feature Grid",faq:"FAQ Accordion",divider:"Divider",countdown:"Countdown Timer",trust:"Trust / Benefit Cards",coupon:"Coupon Display"};

const getContent=(p:Funnel):Content=>({title:p.title,description:p.description,seoTitle:p.seoTitle,noIndex:p.noIndex,endsAt:p.endsAt,blocks:p.blocks});
const numbered=["width","minHeight","fontSize","borderRadius","padding","margin","gap"] as const;
const colored=["backgroundColor","color"] as const;
const elementIcons={hero:ImageIcon,banner:ImageIcon,slider:Rows3,carousel:Layers3,heading:Heading1,paragraph:Type,image:ImageIcon,button:MousePointer2,features:Rows3,faq:Rows3,divider:Minus,countdown:Clock3,trust:Star,coupon:Package} as const;
export default function FunnelBuilder(){
 const upload=useRef<HTMLInputElement>(null),imageFile=useRef<HTMLInputElement>(null),slideFile=useRef<HTMLInputElement>(null),targetSlideRef=useRef<string|null>(null),dragged=useRef<number|null>(null);
 const [pages,setPages]=useState<Funnel[]>([]),[page,setPage]=useState<Funnel|null>(null);
 const [saved,setSaved]=useState(""),[selected,setSelected]=useState<string|null>(null),[rightTab,setRightTab]=useState<"content"|"style"|"seo"|"history"|"advanced">("content");
 const [revisions,setRevisions]=useState<{revision:number;mode:string;createdAt:string;title:string;blockCount:number}[]>([]);
 const [selectedSlide,setSelectedSlide]=useState<string|null>(null);
 const [leftTab,setLeftTab]=useState<"elements"|"sections"|"templates">("elements"),[elementSearch,setElementSearch]=useState(""),[showPages,setShowPages]=useState(false),[showLayers,setShowLayers]=useState(true);
 const [viewport,setViewport]=useState<"desktop"|"tablet"|"mobile">("desktop"),[notice,setNotice]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[mediaStatus,setMediaStatus]=useState<"checking"|"ready"|"unavailable">("checking"),[mediaProblem,setMediaProblem]=useState(""),[search,setSearch]=useState("");
 const previous=useRef<Funnel|null>(null),past=useRef<Funnel[]>([]),future=useRef<Funnel[]>([]),skipHistory=useRef(false);
 const dirty=!!page&&JSON.stringify(page)!==saved;
 const active=page?.blocks.find(b=>b.id===selected);
 const filtered=useMemo(()=>pages.filter(x=>(x.title+" "+x.slug).toLowerCase().includes(search.toLowerCase())),[pages,search]);
 useEffect(()=>{
  if(!page){previous.current=null;return;}
  if(skipHistory.current){skipHistory.current=false;previous.current=structuredClone(page);return;}
  if(previous.current&&JSON.stringify(previous.current)!==JSON.stringify(page)){
   past.current=[...past.current.slice(-49),structuredClone(previous.current)];
   future.current=[];
  }
  previous.current=structuredClone(page);
 },[page]);
 function undoEdit(){
  if(!page||!past.current.length)return;
  const old=past.current.pop()!;
  future.current.push(structuredClone(page));skipHistory.current=true;setPage(old);
 }
 function redoEdit(){
  if(!page||!future.current.length)return;
  const next=future.current.pop()!;
  past.current.push(structuredClone(page));skipHistory.current=true;setPage(next);
 }
 function resetHistory(){previous.current=null;past.current=[];future.current=[];}
 async function load(){
  const response=await fetch("/api/admin/funnel-pages",{cache:"no-store"}),json=await response.json();
  if(!response.ok)throw Error(json.error||"Unable to load campaign pages");
  setPages(json.pages||[]);return json.pages as Funnel[];
 }
 useEffect(()=>{void load().then(items=>{if(items.length)choose(items[0]);}).catch(e=>setError(String(e)));},[]);
 useEffect(()=>{if(!dirty)return;const before=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};window.addEventListener("beforeunload",before);return()=>window.removeEventListener("beforeunload",before);},[dirty]);
 function choose(next:Funnel){
  if(dirty&&!window.confirm("Discard unsaved campaign edits?"))return;
  resetHistory();const copy=structuredClone(next);copy.blocks=copy.blocks.map(b=>funnelBlock.parse(b));setPage(copy);setSaved(JSON.stringify(copy));setSelected(copy.blocks[0]?.id||null);setSelectedSlide(copy.blocks[0]?.slides?.[0]?.id||null);setRightTab("content");setNotice("");setError("");
 }
 function create(){
  if(dirty&&!window.confirm("Discard unsaved changes?"))return;
  resetHistory();const next=empty();setPage(next);setSaved(JSON.stringify(next));setSelected(next.blocks[0].id);setSelectedSlide(null);setRightTab("content");setNotice("");setError("");
 }
 function patch(values:Partial<Funnel>){setPage(p=>p?{...p,...values}:p);}
 function updateBlock(id:string,values:Partial<Block>){
  setPage(p=>p?{...p,blocks:p.blocks.map(b=>{
   if(b.id!==id)return b;
   const changed={...b,...values};
   if((values.kind==="slider"||values.kind==="carousel")&&b.kind!==values.kind&&!changed.slides.length)
    changed.slides=[initialFunnelSlide(),initialFunnelSlide()];
   return funnelBlock.parse(changed);
  })}:p);
 }
 function patchSlide(blockId:string,slideId:string,values:Partial<Block["slides"][number]>){
  setPage(p=>p?{...p,blocks:p.blocks.map(b=>b.id===blockId?{...b,slides:b.slides.map(sl=>sl.id===slideId?{...sl,...values}:sl)}:b)}:p);
 }
 function addSlide(blockId:string){
  const block=page?.blocks.find(b=>b.id===blockId);if(!block||block.slides.length>=16)return;
  const next=initialFunnelSlide();updateBlock(blockId,{slides:[...block.slides,next]});setSelectedSlide(next.id);
 }
 function removeSlide(blockId:string,slideId:string){
  const block=page?.blocks.find(b=>b.id===blockId);if(!block||block.slides.length<=1)return;
  const slides=block.slides.filter(sl=>sl.id!==slideId);updateBlock(blockId,{slides});setSelectedSlide(slides[0]?.id||null);
 }
 function moveSlide(blockId:string,index:number,delta:number){
  const block=page?.blocks.find(b=>b.id===blockId);if(!block||index+delta<0||index+delta>=block.slides.length)return;
  const slides=[...block.slides],removed=slides.splice(index,1);slides.splice(index+delta,0,removed[0]);updateBlock(blockId,{slides});
 }
 function updateStyle(id:string,key:keyof Style,value:string){
  setPage(p=>p?{...p,blocks:p.blocks.map(b=>b.id===id?{...b,style:{...b.style,[key]:value}}:b)}:p);
 }
 function add(kind:Block["kind"]){
  if(!page||page.blocks.length>=50)return;
  const block=initialFunnelBlock(kind) as Block;
  patch({blocks:[...page.blocks,block]});setSelected(block.id);setSelectedSlide(block.slides[0]?.id||null);setRightTab("content");
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
 function applyPreset(name:"product"|"offer"|"story"){
  if(!page)return;
  if(!window.confirm("Replace this campaign's current blocks with the "+name+" template?"))return;
  const make=(kind:Block["kind"],values:Partial<Block>={})=>({...initialFunnelBlock(kind),...values,id:crypto.randomUUID()}) as Block;
  const blocks=name==="product"?[
   make("hero",{title:"Meet your new favorite",body:"Introduce your product and its verified benefits.",buttonLabel:"Explore the Collection",buttonUrl:"/shop"}),
   make("features",{title:"Why customers choose ANUSMITA",items:[{title:"Quality",body:"Add verified product details."},{title:"Easy Shopping",body:"Discover available collections."},{title:"Support",body:"Contact our team with your questions."}]}),
   make("image",{title:"Showcase your product"}),
   make("faq",{title:"Frequently asked questions",items:[{title:"How do I place an order?",body:"Browse our store and proceed through official checkout."}]}),
   make("button",{buttonLabel:"Shop Now",buttonUrl:"/shop"})
  ]:name==="offer"?[
   make("hero",{title:"A special offer awaits",body:"Highlight the actual campaign terms and dates.",buttonLabel:"Shop Offers",buttonUrl:"/deals"}),
   make("countdown",{title:"Campaign ends in",body:"Offer expires at the published campaign deadline.",expiresAt:page.endsAt||""}),
   make("trust",{title:"Shop with confidence",items:[{title:"Verified Product",body:"Add genuine product details."},{title:"Customer Care",body:"Our team is available to help."}]}),
   make("button",{buttonLabel:"Explore Deals",buttonUrl:"/deals"})
  ]:[
   make("hero",{title:"Our Story",body:"Tell visitors what makes your brand special.",buttonLabel:"Meet ANUSMITA",buttonUrl:"/about"}),
   make("heading",{title:"What inspires us"}),
   make("paragraph",{body:"Describe your brand's mission, products and customer promise."}),
   make("features",{title:"What we value",items:[{title:"Care",body:"Describe your brand's care standards."},{title:"Design",body:"Describe your approach to quality."}]}),
   make("button",{buttonLabel:"View Collection",buttonUrl:"/shop"})
  ];
  patch({blocks});setSelected(blocks[0].id);setNotice(name+" template applied locally. Review all text and media before publishing.");
 }
  function clonePage(){
  if(!page)return;
  const next={...structuredClone(page),id:undefined,title:page.title+" (Copy)",slug:"campaign-copy-"+crypto.randomUUID().slice(0,8),revision:0,published:false,archived:false,hasDraft:false,
   blocks:page.blocks.map(b=>({...b,id:crypto.randomUUID()}))};
  resetHistory();setPage(next);setSelected(next.blocks[0].id);setSaved(JSON.stringify(next));setNotice("Campaign cloned locally with a new unique slug. You can edit its slug before saving.");
 }
 async function checkMedia():Promise<boolean>{
  setMediaStatus("checking");
  try{
   const response=await fetch("/api/admin/funnel-pages/media",{cache:"no-store"});
   const body=await response.json().catch(()=>({error:"Media service returned an invalid response"}));
   if(!response.ok)throw Error(body.error||"Media service unavailable ("+response.status+")");
   setMediaStatus("ready");setMediaProblem("");return true;
  }catch(error){
   setMediaStatus("unavailable");setMediaProblem(error instanceof Error?error.message:"Media service is unavailable");return false;
  }
 }
 useEffect(()=>{void checkMedia();},[]);
  async function uploadImage(file?:File,slideId?:string){
  if(!file||!page||!active||uploading)return;
  if(!page.slug){setError("Set a campaign slug before uploading images.");return;}
  if(file.size>3*1024*1024||!["image/jpeg","image/png","image/webp"].includes(file.type)){setError("JPG, PNG or WebP images must be under 3 MB.");return;}
  const id=active.id;setUploading(true);setError("");
  try{
   const data=new FormData();data.set("slug",page.slug);data.set("file",file);
   const response=await fetch("/api/admin/funnel-pages/media",{method:"POST",body:data});
   const json=await response.json().catch(()=>({error:"Upload server returned a non-JSON error"}));
   if(!response.ok)throw Error(json.error||"Image upload failed (HTTP "+response.status+")");
   if(slideId)patchSlide(id,slideId,{imageUrl:json.url});else updateBlock(id,{imageUrl:json.url});
   setMediaStatus("ready");setMediaProblem("");
   setNotice("Campaign image uploaded to Cloudflare R2. Save draft or publish to use it on your funnel.");
  }catch(e){setError(e instanceof Error?e.message:"Upload failed");}
  finally{setUploading(false);if(imageFile.current)imageFile.current.value="";if(slideFile.current)slideFile.current.value="";targetSlideRef.current=null;}
 }
  async function loadRevisions(){
  if(!page?.slug)return;
  setError("");
  try{
   const r=await fetch("/api/admin/funnel-pages/revisions?slug="+encodeURIComponent(page.slug),{cache:"no-store"});
   const json=await r.json();if(!r.ok)throw Error(json.error||"Unable to load revisions");
   setRevisions(json.revisions||[]);
  }catch(e){setError(e instanceof Error?e.message:"Cannot load revisions");}
 }
 async function rollback(sourceRevision:number){
  if(!page||busy)return;
  if(dirty){setError("Save or discard current edits before restoring a revision.");return;}
  if(!window.confirm("Restore revision "+sourceRevision+" as a new draft? Published content will remain unchanged."))return;
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/admin/funnel-pages/revisions",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({slug:page.slug,sourceRevision,currentRevision:page.revision})});
   const json=await r.json();if(!r.ok)throw Error(json.error||"Rollback failed");
   const updated={...page,...json.content,revision:json.revision,hasDraft:true};
   setPage(updated);setSaved(JSON.stringify(updated));setSelected(updated.blocks[0]?.id||null);
   setNotice("Version "+sourceRevision+" restored as draft. Review and publish manually when ready.");
   await load();
   setRightTab("content");
  }catch(e){setError(e instanceof Error?e.message:"Rollback failed");}
  finally{setBusy(false);}
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
   const next:{[K in keyof Funnel]:Funnel[K]}={...empty(),...validated,blocks:validated.blocks.map(b=>funnelBlock.parse({...b,id:crypto.randomUUID(),slides:b.slides.map(sl=>({...sl,id:crypto.randomUUID()}))}))};
   resetHistory();setPage(next);setSaved(JSON.stringify(next));setSelected(next.blocks[0].id);setNotice("JSON imported as a new draft. Choose a unique slug.");
  }catch(e){setError("Import rejected: "+(e instanceof Error?e.message:String(e)));}
  finally{if(upload.current)upload.current.value="";}
 }
 function setItem(index:number,key:"title"|"body",value:string){
  if(!active)return;updateBlock(active.id,{items:active.items.map((it,i)=>i===index?{...it,[key]:value}:it)});
 }
 return <div className="anFB">
  <header className="anFBTop"><div className="anFBHeadingBrand"><span className="anFBHeadingIcon"><Layers3 size={22}/></span><div><h1>Custom Pages &amp; Funnel Builder <span className="anFBEnterprise"><Crown size={13}/> Enterprise</span></h1><p>Build landing pages, campaign funnels and custom pages with drag &amp; drop.</p></div></div><div className="anFBTopActions"><div className="anFBGlobalSearch"><Search size={15}/><input aria-label="Search saved campaigns" value={search} onChange={e=>{setSearch(e.target.value);setShowPages(true)}} placeholder="Search pages, templates, components…"/><kbd>⌘ K</kbd></div><button type="button" onClick={create}><Plus size={16}/> Create New Page</button></div></header>
  <nav className="anFBRibbon" aria-label="Funnel builder features"><Link className="active" href="/admin/custom-pages"><Layers3 size={16}/> Custom Pages</Link><button onClick={()=>{setShowPages(v=>!v);setLeftTab("elements")}}><Rows3 size={15}/> Funnels</button><button onClick={()=>setLeftTab("templates")}><LayoutTemplate size={15}/> Templates</button><button disabled title="A/B testing needs verified visitor assignment and conversion attribution"><Rows3 size={15}/> A/B Testing</button><button disabled={!page} onClick={()=>{setRightTab("history");void loadRevisions()}}><RotateCcw size={15}/> Revisions</button><button disabled={!page} onClick={()=>setRightTab("seo")}><Settings2 size={15}/> SEO</button><button disabled title="Funnel analytics requires verified event tracking"><ChartNoAxesColumnIncreasing size={15}/> Analytics</button><button disabled={!page} onClick={()=>setRightTab("advanced")}><Settings2 size={15}/> Settings</button><div className="anFBRibbonEnd"><button onClick={()=>upload.current?.click()}><Upload size={15}/> Import JSON</button><button onClick={exportPage} disabled={!page}><Download size={15}/> Export JSON</button><button onClick={create} className="anFBCreate"><Plus size={16}/> New Page</button></div><input ref={upload} hidden type="file" accept=".json,application/json" onChange={e=>void importPage(e.target.files?.[0])}/></nav>
  {error&&<p role="alert" className="anFBError">{error}</p>}{notice&&<p role="status" className="anFBNotice">{notice}</p>}
  <div className="anFBGrid">
   <aside className="anFBLeft"><div className="anFBLeftTabs"><button className={leftTab==="elements"?"active":""} onClick={()=>setLeftTab("elements")}>Elements</button><button className={leftTab==="sections"?"active":""} onClick={()=>setLeftTab("sections")}>Sections</button><button className={leftTab==="templates"?"active":""} onClick={()=>setLeftTab("templates")}>Templates</button></div>
    {leftTab==="elements"?<><div className="anFBElementSearch"><Search size={15}/><input value={elementSearch} onChange={e=>setElementSearch(e.target.value)} placeholder="Search element…"/></div><div className="anFBSectionHeading"><strong>Basic Elements</strong><ChevronUp size={15}/></div><div className="anFBElements">{funnelKinds.filter(k=>names[k].toLowerCase().includes(elementSearch.toLowerCase())||k.includes(elementSearch.toLowerCase())).map(kind=>{const Icon=elementIcons[kind];return <button key={kind} title={"Add "+names[kind]} disabled={!page||page.blocks.length>=50} onClick={()=>add(kind)}><Icon size={21}/><span>{names[kind]}</span></button>})}</div><div className="anFBElementGroups">{["Funnel & Marketing","Ecommerce","Media & Interactive","Layout & Grid","Social & Trust","Advanced"].map(group=><button key={group} onClick={()=>setLeftTab("templates")}><Layers3 size={14}/>{group}<ChevronDown size={14}/></button>)}</div></>:leftTab==="sections"?<><div className="anFBSectionHeading"><strong>Page Sections</strong><span>{page?.blocks.length||0}</span></div>{page?.blocks.map((b,i)=><button className={"anFBSectionItem"+(selected===b.id?" active":"")} key={b.id} onClick={()=>setSelected(b.id)}><GripVertical size={14}/> {i+1}. {names[b.kind]}</button>)}<button className="anFBSectionItem" onClick={()=>add("hero")} disabled={!page}><Plus size={14}/> Add Section</button></>:<><div className="anFBSectionHeading"><strong>Ready-made Templates</strong><span>3</span></div><div className="anFBPresets"><button disabled={!page} onClick={()=>applyPreset("product")}>Product Launch</button><button disabled={!page} onClick={()=>applyPreset("offer")}>Flash Sale / Offer</button><button disabled={!page} onClick={()=>applyPreset("story")}>Brand Story</button></div></>}
    <div className="anFBSectionHeading"><strong>Campaign Pages</strong><button className="anFBMiniButton" onClick={()=>setShowPages(v=>!v)}>{showPages?"Hide":"Browse"}</button></div>{showPages&&<div className="anFBPageList">{filtered.map(p=><button key={p.slug} onClick={()=>choose(p)} className={page?.slug===p.slug?"active":""}><span><strong>{p.title}</strong><small>/funnel/{p.slug}</small></span><em>{p.archived?"Archived":p.published?"Live":"Draft"}</em></button>)}{!filtered.length&&<p>No saved funnels yet</p>}</div>}
    <div className="anFBAssets"><button onClick={()=>setLeftTab("templates")}><Layers3 size={15}/> Saved Blocks <strong>{page?.blocks.length||0}</strong></button><button onClick={()=>setLeftTab("templates")}><LayoutTemplate size={15}/> Global Templates <strong>3</strong></button><button onClick={()=>upload.current?.click()}><Copy size={15}/> Import Components</button></div>
   </aside>
   <section className="anFBCenter">{page?<><div className="anFBToolbar"><div><input className="anFBPageTitle" aria-label="Funnel title" value={page.title} maxLength={100} placeholder="Campaign title" onChange={e=>patch({title:e.target.value})}/><small className="anFBPageStatus"><span className={page.published&&!page.archived?"live":"draft"}>{page.archived?"Archived":page.published?"● Live":"● Draft"}</span> /funnel/{page.slug||"new-campaign"} · Rev {page.revision}{page.hasDraft?" · Unpublished changes":""}</small></div>
    <div className="anFBToolbarRight"><button aria-label="Desktop preview" className={viewport==="desktop"?"active":""} onClick={()=>setViewport("desktop")}><Monitor size={16}/></button><button aria-label="Tablet preview" className={viewport==="tablet"?"active":""} onClick={()=>setViewport("tablet")}><Tablet size={16}/></button><button aria-label="Mobile preview" className={viewport==="mobile"?"active":""} onClick={()=>setViewport("mobile")}><Smartphone size={16}/></button></div></div>
    <div className="anFBActionbar"><div className="anFBUndoGroup"><button type="button" aria-label="Undo edit" onClick={undoEdit}><RotateCcw size={15}/></button><button type="button" aria-label="Redo edit" onClick={redoEdit}><RotateCw size={15}/></button></div><button onClick={()=>void save("draft")} disabled={busy}><Save size={15}/> Save Draft</button><button className="primary" onClick={()=>void save("publish")} disabled={busy||page.archived}><Check size={15}/> Publish</button>{page.published&&!page.archived&&<Link href={"/funnel/"+page.slug} target="_blank"><Eye size={15}/> Live</Link>}<span>{dirty?"Unsaved changes":"All changes saved"}</span></div>
    <div className={"anFBCanvasStage "+viewport}><div className="anFunnelRoot anFBPreviewRoot"><div className="anFunnelPublicHeader"><span className="anFunnelLogo">ANUSMITA</span><span>Discover Your Glow</span></div><FunnelBlocks blocks={page.blocks} selected={selected} onPick={setSelected}/></div></div>
    <div className="anFBOutline"><strong>Layers ({page.blocks.length})</strong>{page.blocks.map((b,i)=><div draggable key={b.id} onDragStart={()=>{dragged.current=i}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(dragged.current!==null)move(dragged.current,i);dragged.current=null}} className={selected===b.id?"selected":""}><button onClick={()=>setSelected(b.id)}><GripVertical size={15}/>{i+1}. {names[b.kind]}</button><button title="Move up" disabled={i===0} onClick={()=>move(i,i-1)}><ArrowUp size={14}/></button><button title="Move down" disabled={i===page.blocks.length-1} onClick={()=>move(i,i+1)}><ArrowDown size={14}/></button><button title="Duplicate" onClick={()=>duplicate(b.id)}><Copy size={14}/></button><button title="Delete" disabled={page.blocks.length===1} onClick={()=>remove(b.id)}><Trash2 size={14}/></button></div>)}</div>
   </>:<div className="anFBEmpty"><ImageIcon size={38}/><h2>Build your next high-converting page</h2><p>Select a saved campaign or create a funnel to start adding sections.</p><button onClick={create}><Plus size={16}/> Create Funnel</button></div>}</section>
   <aside className="anFBRight">{page?<><div className="anFBInspectorTabs"><button className={rightTab==="content"?"active":""} onClick={()=>setRightTab("content")}>Design</button><button className={rightTab==="style"?"active":""} onClick={()=>setRightTab("style")}>Style</button><button className={rightTab==="advanced"?"active":""} onClick={()=>setRightTab("advanced")}>Advanced</button></div><div className="anFBSelectedLabel">Selected: <strong>{active?names[active.kind]:"No element"}</strong></div>
    {rightTab==="history"?<div className="anFBFields"><h3>Revision History</h3><p>Restoring a version creates a new draft; published pages do not change until you publish again.</p><button onClick={()=>void loadRevisions()}><RefreshCw size={15}/> Refresh History</button>{revisions.map(v=><div key={v.revision} className="anFBItem"><strong>Revision {v.revision} · {v.mode}</strong><small>{new Date(v.createdAt).toLocaleString("en-BD")}</small><span>{v.title} · {v.blockCount} blocks</span><button disabled={busy||dirty} onClick={()=>void rollback(v.revision)}><Undo2 size={14}/> Restore as Draft</button></div>)}</div>:rightTab==="seo"?<div className="anFBFields"><h3>Campaign Settings</h3><label>URL Slug<input disabled={page.revision>0} value={page.slug} onChange={e=>patch({slug:e.target.value.toLowerCase()})} maxLength={80}/></label><p>New pages receive a unique slug automatically; edit it here before the first save.</p><label>Meta Title<input value={page.seoTitle} maxLength={70} onChange={e=>patch({seoTitle:e.target.value})}/></label><label>Meta Description<textarea value={page.description} maxLength={160} onChange={e=>patch({description:e.target.value})}/></label><label>Campaign Expiration (optional)<input type="datetime-local" value={page.endsAt?new Date(page.endsAt).toISOString().slice(0,16):""} onChange={e=>patch({endsAt:e.target.value?new Date(e.target.value).toISOString():""})}/></label><p>Once expired, the public funnel route automatically becomes unavailable. Existing draft/history records remain stored.</p><label className="anFBCheck"><input type="checkbox" checked={page.noIndex} onChange={e=>patch({noIndex:e.target.checked})}/> NoIndex</label><button onClick={()=>void save(page.archived?"restore":"archive")} disabled={busy}>{page.archived?<Undo2 size={15}/>:<Archive size={15}/>} {page.archived?"Restore as Draft":"Archive Page"}</button><p>Archive hides published content without deleting saved records.</p></div>:
     active?<div className="anFBFields">{rightTab!=="style"&&<h3>{names[active.kind]}</h3>}
      {rightTab==="content"?<>
       <label>Block Type<select value={active.kind} onChange={e=>updateBlock(active.id,{kind:e.target.value as Block["kind"]})}>{funnelKinds.map(k=><option key={k} value={k}>{names[k]}</option>)}</select></label>
       <label>Title<input maxLength={220} value={active.title} onChange={e=>updateBlock(active.id,{title:e.target.value})}/></label>
       <label>Body<textarea maxLength={2400} rows={4} value={active.body} onChange={e=>updateBlock(active.id,{body:e.target.value})}/></label>
       {["hero","banner","image"].includes(active.kind)&&<div className="anFBMediaPanel">
        <div className="anFBMediaHeading"><strong>{active.kind==="banner"?"Banner Image":active.kind==="image"?"Image Media":"Hero Banner Image"}</strong><span>Independent image · JPG/PNG/WebP · 3 MB</span></div><div className={"anFBMediaReadiness "+mediaStatus}>{mediaStatus==="ready"?"R2 upload connection ready":mediaStatus==="checking"?"Checking upload connection…":"Image upload unavailable: "+mediaProblem}<button type="button" disabled={mediaStatus==="checking"} onClick={()=>void checkMedia()}><RefreshCw size={13}/> Recheck</button></div>
        {active.imageUrl?<img className="anFBMediaPreview" src={active.imageUrl} alt={active.title||"Selected funnel image"}/>:<div className="anFBMediaPlaceholder"><ImageIcon size={23}/><span>No image selected — upload your own image</span></div>}
        <input ref={imageFile} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void uploadImage(e.target.files?.[0])}/>
        <div className="anFBMediaActions"><button type="button" disabled={uploading} onClick={()=>imageFile.current?.click()}><Upload size={15}/> {uploading?"Uploading…":active.imageUrl?"Replace Image":"Upload Image"}</button><button type="button" disabled={!active.imageUrl||uploading} onClick={()=>updateBlock(active.id,{imageUrl:""})}><Trash2 size={14}/> Remove</button></div>
        <label>Image URL (HTTPS or /path)<input value={active.imageUrl} onChange={e=>updateBlock(active.id,{imageUrl:e.target.value})} placeholder="https://…"/></label>
        <small>Image changes update the canvas immediately. Save Draft then Publish to update the public funnel.</small>
       </div>}
       {["hero","banner","image","button","coupon"].includes(active.kind)&&<><label>Button / Coupon Label<input value={active.buttonLabel} onChange={e=>updateBlock(active.id,{buttonLabel:e.target.value})}/></label><label>Destination URL<input value={active.buttonUrl} onChange={e=>updateBlock(active.id,{buttonUrl:e.target.value})} placeholder="/shop"/></label></>}
       {(active.kind==="slider"||active.kind==="carousel")&&<div className="anFBSlideEditor">
        <h4>{names[active.kind]} · {active.slides.length} slides</h4>
        <label>Autoplay<input type="checkbox" checked={active.autoplay} onChange={e=>updateBlock(active.id,{autoplay:e.target.checked})}/></label>
        <label>Autoplay Seconds<input type="number" min="2" max="15" value={active.intervalMs/1000} onChange={e=>updateBlock(active.id,{intervalMs:Math.min(15000,Math.max(2000,Math.round((Number(e.target.value)||5)*1000)))})}/></label>
        <label>Show Arrows<input type="checkbox" checked={active.showArrows} onChange={e=>updateBlock(active.id,{showArrows:e.target.checked})}/></label>
        <label>Show Dots<input type="checkbox" checked={active.showDots} onChange={e=>updateBlock(active.id,{showDots:e.target.checked})}/></label>
        <input ref={slideFile} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>void uploadImage(e.target.files?.[0],targetSlideRef.current||active.slides[0]?.id)}/>
        <div className="anFBMediaHeading"><strong>Slide Image Manager</strong><span>Each slide has its own image, text and link</span></div><div className={"anFBMediaReadiness "+mediaStatus}>{mediaStatus==="ready"?"R2 upload connection ready":mediaStatus==="checking"?"Checking upload connection…":"Image upload unavailable: "+mediaProblem}<button type="button" disabled={mediaStatus==="checking"} onClick={()=>void checkMedia()}><RefreshCw size={13}/> Recheck</button></div>
        {active.slides.map((slide,i)=><div key={slide.id} className="anFBSlideCard">
         <div className="anFBSlideCardTop"><strong>Slide {i+1}</strong><button disabled={i===0} onClick={()=>moveSlide(active.id,i,-1)} aria-label="Move earlier"><ArrowUp size={14}/></button><button disabled={i===active.slides.length-1} onClick={()=>moveSlide(active.id,i,1)} aria-label="Move later"><ArrowDown size={14}/></button><button disabled={active.slides.length<=1} onClick={()=>removeSlide(active.id,slide.id)} aria-label="Delete slide"><Trash2 size={14}/></button></div>
         <label>Image URL<input value={slide.imageUrl} onChange={e=>patchSlide(active.id,slide.id,{imageUrl:e.target.value})} placeholder="https://…"/></label>
         <div className="anFBMediaActions"><button type="button" disabled={uploading} onClick={()=>{targetSlideRef.current=slide.id;setSelectedSlide(slide.id);slideFile.current?.click()}}><Upload size={14}/> {uploading?"Uploading…":slide.imageUrl?"Replace Slide Image":"Upload Slide Image"}</button><button type="button" disabled={!slide.imageUrl||uploading} onClick={()=>patchSlide(active.id,slide.id,{imageUrl:""})}><Trash2 size={14}/> Remove Image</button></div>
         {slide.imageUrl&&<img className="anFBSlideThumb" src={slide.imageUrl} alt={slide.alt||slide.title}/>}
         <label>Title<input maxLength={220} value={slide.title} onChange={e=>patchSlide(active.id,slide.id,{title:e.target.value})}/></label>
         <label>Description<textarea maxLength={700} rows={2} value={slide.body} onChange={e=>patchSlide(active.id,slide.id,{body:e.target.value})}/></label>
         <label>Image Alt Text<input maxLength={160} value={slide.alt} onChange={e=>patchSlide(active.id,slide.id,{alt:e.target.value})}/></label>
         <label>CTA Text<input value={slide.buttonLabel} onChange={e=>patchSlide(active.id,slide.id,{buttonLabel:e.target.value})}/></label>
         <label>CTA URL<input value={slide.buttonUrl} onChange={e=>patchSlide(active.id,slide.id,{buttonUrl:e.target.value})}/></label>
        </div>)}
        <button type="button" disabled={active.slides.length>=16} onClick={()=>addSlide(active.id)}><Plus size={15}/> Add New Slide</button>
       </div>}
       {active.kind==="countdown"&&<label>Expiration (ISO datetime)<input type="datetime-local" value={active.expiresAt.slice(0,16)} onChange={e=>updateBlock(active.id,{expiresAt:e.target.value?new Date(e.target.value).toISOString():""})}/></label>}
       {["features","faq","trust"].includes(active.kind)&&<><strong>Cards / Accordion Items</strong>{active.items.map((it,i)=><div key={i} className="anFBItem"><label>Title<input value={it.title} maxLength={140} onChange={e=>setItem(i,"title",e.target.value)}/></label><label>Description<textarea value={it.body} maxLength={500} onChange={e=>setItem(i,"body",e.target.value)}/></label><button onClick={()=>updateBlock(active.id,{items:active.items.filter((_,j)=>j!==i)})}><Trash2 size={14}/> Remove</button></div>)}<button disabled={active.items.length>=12} onClick={()=>updateBlock(active.id,{items:[...active.items,{title:"New item",body:"Description"}]})}><Plus size={14}/> Add Item</button></>}
       </>:rightTab==="advanced"?<>
        <details className="anFBAccordion" open><summary>Layout &amp; Grid</summary><label>Display<select value={active.style.display||"block"} onChange={e=>updateStyle(active.id,"display",e.target.value)}>{["block","flex","grid"].map(k=><option key={k} value={k}>{k}</option>)}</select></label><label>Flex Direction<select value={active.style.flexDirection||"row"} onChange={e=>updateStyle(active.id,"flexDirection",e.target.value)}>{["row","column"].map(k=><option key={k} value={k}>{k}</option>)}</select></label><label>Grid Columns<select value={active.style.gridColumns||"3"} onChange={e=>updateStyle(active.id,"gridColumns",e.target.value)}>{["1","2","3","4"].map(k=><option key={k} value={k}>{k}</option>)}</select></label></details>
        <details className="anFBAccordion" open><summary>Dimensions</summary>{(["width","minHeight","gap"] as const).map(key=><label key={key}>{key}<input value={active.style[key]||""} placeholder="auto" onChange={e=>updateStyle(active.id,key,e.target.value)}/></label>)}</details>
        <details className="anFBAccordion"><summary>Opacity &amp; Effects</summary><label>Opacity (0–1)<input type="number" min="0" max="1" step=".05" value={active.style.opacity||"1"} onChange={e=>updateStyle(active.id,"opacity",e.target.value)}/></label><label>Box Shadow<select value={active.style.boxShadow||"none"} onChange={e=>updateStyle(active.id,"boxShadow",e.target.value)}>{["none","soft","medium","strong"].map(k=><option key={k} value={k}>{k}</option>)}</select></label></details>
        <button onClick={()=>duplicate(active.id)}><Copy size={15}/> Duplicate Element</button><button disabled={page.blocks.length<=1} onClick={()=>remove(active.id)}><Trash2 size={15}/> Delete Element</button>
       </>:<>
        <details className="anFBAccordion" open><summary>Typography</summary>
         <label>Font Family<select value={active.style.fontFamily||"Georgia"} onChange={e=>updateStyle(active.id,"fontFamily",e.target.value)}><option value="Georgia">Georgia / Display Serif</option><option value="Arial">Arial / Sans</option><option value="serif">Serif</option><option value="sans-serif">Sans Serif</option></select></label>
         <label>Weight<select value={active.style.fontWeight||"700"} onChange={e=>updateStyle(active.id,"fontWeight",e.target.value)}>{["400","500","600","700","800"].map(k=><option key={k} value={k}>{k}</option>)}</select></label>
         <label>Size <span className="anFBInlineControl"><input type="range" min="12" max="100" value={Number.parseInt(active.style.fontSize||"40",10)||40} onChange={e=>updateStyle(active.id,"fontSize",e.target.value+"px")}/><input aria-label="Font size in pixels" type="number" min="12" max="100" value={Number.parseInt(active.style.fontSize||"40",10)||40} onChange={e=>updateStyle(active.id,"fontSize",e.target.value+"px")}/><span>px</span></span></label>
         <label>Line Height <span className="anFBInlineControl"><input type="range" min="1" max="3" step=".05" value={Number.parseFloat(active.style.lineHeight||"1.2")||1.2} onChange={e=>updateStyle(active.id,"lineHeight",e.target.value)}/><input aria-label="Line height" type="number" min="1" max="3" step=".05" value={active.style.lineHeight||"1.2"} onChange={e=>updateStyle(active.id,"lineHeight",e.target.value)}/></span></label>
         <label>Letter Spacing <span className="anFBInlineControl"><input type="range" min="-3" max="10" step=".5" value={Number.parseFloat(active.style.letterSpacing||"0")} onChange={e=>updateStyle(active.id,"letterSpacing",e.target.value+"px")}/><input aria-label="Letter spacing" type="number" min="-3" max="10" step=".5" value={Number.parseFloat(active.style.letterSpacing||"0")} onChange={e=>updateStyle(active.id,"letterSpacing",e.target.value+"px")}/><span>px</span></span></label>
         <label>Align<select value={active.style.textAlign||"left"} onChange={e=>updateStyle(active.id,"textAlign",e.target.value)}>{["left","center","right"].map(k=><option key={k} value={k}>{k}</option>)}</select></label>
         <label>Text Color <span className="anFBColorField"><input type="color" aria-label="Text color swatch" value={/^#[0-9a-f]{6}$/i.test(active.style.color||"")?active.style.color:"#5a0f2e"} onChange={e=>updateStyle(active.id,"color",e.target.value)}/><input value={active.style.color||"#5a0f2e"} onChange={e=>updateStyle(active.id,"color",e.target.value)}/></span></label>
        </details>
        <details className="anFBAccordion"><summary>Background</summary><label>Background Color <span className="anFBColorField"><input type="color" aria-label="Background color swatch" value={/^#[0-9a-f]{6}$/i.test(active.style.backgroundColor||"")?active.style.backgroundColor:"#ffffff"} onChange={e=>updateStyle(active.id,"backgroundColor",e.target.value)}/><input value={active.style.backgroundColor||"#ffffff"} onChange={e=>updateStyle(active.id,"backgroundColor",e.target.value)}/></span></label></details>
        <details className="anFBAccordion"><summary>Border</summary><label>Border Style<select value={active.style.borderStyle||"none"} onChange={e=>updateStyle(active.id,"borderStyle",e.target.value)}>{["none","solid","dashed","dotted"].map(k=><option key={k} value={k}>{k}</option>)}</select></label><label>Border Width<input value={active.style.borderWidth||"0"} onChange={e=>updateStyle(active.id,"borderWidth",e.target.value)} placeholder="1px"/></label><label>Border Color<input value={active.style.borderColor||"#edd4de"} onChange={e=>updateStyle(active.id,"borderColor",e.target.value)}/></label></details>
        <details className="anFBAccordion" open><summary>Border Radius</summary><label>Radius<input value={active.style.borderRadius||"12px"} onChange={e=>updateStyle(active.id,"borderRadius",e.target.value)} placeholder="12px"/></label></details>
        <details className="anFBAccordion" open><summary>Spacing (Margin / Padding)</summary><label>Margin<input value={active.style.margin||"0"} onChange={e=>updateStyle(active.id,"margin",e.target.value)} placeholder="0"/></label><label>Padding<input value={active.style.padding||"24px"} onChange={e=>updateStyle(active.id,"padding",e.target.value)} placeholder="24px"/></label><div className="anFBBoxModel"><span>Margin</span><div><span>Padding</span></div></div></details>
        <details className="anFBAccordion"><summary>Box Shadow</summary><label>Intensity<select value={active.style.boxShadow||"none"} onChange={e=>updateStyle(active.id,"boxShadow",e.target.value)}>{["none","soft","medium","strong"].map(k=><option key={k} value={k}>{k}</option>)}</select></label></details>
        <details className="anFBAccordion"><summary>Transform &amp; Effects</summary><label>Opacity<input type="number" min="0" max="1" step=".05" value={active.style.opacity||"1"} onChange={e=>updateStyle(active.id,"opacity",e.target.value)}/></label></details>
       </>}
     </div>:<div className="anFBFields"><p>Select a block from the canvas to edit its content or CSS.</p></div>}
   </>:<div className="anFBFields"><p>Create or select a funnel to begin.</p></div>}</aside>
  </div>
 </div>;
}
