"use client";
import {useEffect,useMemo,useState} from "react";
import {Plus,Save,ArrowUp,ArrowDown,Trash2,Copy,Eye,ExternalLink,FileText,LayoutGrid,Info,RefreshCw} from "lucide-react";
import "./studio-multipage.css";
import CmsPageSlotsEditor from "@/components/cms-page-slots-editor";
import type {CmsSlotPage} from "@/lib/cms-page-slots";
import {shouldConfirmCustomDraftReplacement} from "@/lib/cms-navigation-guard";
type Block={id:string;type:"heading"|"paragraph"|"callout";text:string};
type Page={slug:string;title:string;description:string;published:boolean;revision:number;blocks:Block[]};
const blank=():Page=>({slug:"",title:"New Landing Page",description:"",published:false,revision:0,blocks:[{id:crypto.randomUUID(),type:"heading",text:"Welcome to ANUSMITA"}]});
const routes=[
 {name:"Shop",path:"/shop",editor:"/admin/products/manage",note:"Products, filters, availability and merchandising are managed through Product Management and the Homepage product shelves."},
 {name:"Deals",path:"/deals",editor:"/admin?tab=Homepage%20Studio",note:"Native promotions remain data-backed; editable editorial slots and hero are in this page canvas."},
 {name:"Bundles",path:"/bundles",editor:"/admin/products/manage",note:"Bundles must connect to real inventory and catalog rules; no independent layout publisher is installed yet."},
 {name:"Journal",path:"/journal/design-preview",editor:"/admin?tab=Custom%20Pages",note:"The current Journal storefront is a design preview, not a generic published CMS page. The accounting Journal is a separate financial module."},
 {name:"About",path:"/about/design-preview",editor:"/admin?tab=Custom%20Pages",note:"The existing About page is code-managed. Create a new custom landing page without overwriting it."},
 {name:"Contact",path:"/contact/design-preview",editor:"/admin?tab=Custom%20Pages",note:"The existing Contact design preview has separate form flows. Editing custom pages does not change those flows."},
 {name:"Cart",path:"/cart",editor:"/admin?tab=Orders",note:"Cart logic is application-managed; page-builder replacement could break customer cart state."},
 {name:"Checkout",path:"/checkout",editor:"/admin?tab=Orders",note:"Checkout has payment and order safety requirements. The storefront is not enabled for arbitrary canvas replacement."},
 {name:"Gift Cards",path:"/gift-cards",editor:"/admin?tab=Products",note:"Gift card experience is currently its own route and cannot be overwritten by custom page blocks."},
 {name:"Pre-orders",path:"/pre-orders",editor:"/admin/products/manage",note:"Pre-orders must follow verified product availability and fulfilment rules."},
 {name:"Customer Stories",path:"/customer-stories",editor:"/admin?tab=Custom%20Pages",note:"The stories route is independently rendered; no authenticated story collection integration is available in this editor."},
 {name:"Wishlist",path:"/wishlist",editor:"/admin?tab=Products",note:"Wishlist behaviour depends on customer state and is not a generic CMS page."},
 {name:"Routine Quiz",path:"/routine-quiz",editor:"/admin?tab=Custom%20Pages",note:"The quiz uses interactive logic; page blocks cannot currently replace it safely."},
 {name:"Track Order",path:"/track-order",editor:"/admin?tab=Orders",note:"Tracking depends on verified order status and courier integrations."}
] as const;
export default function StudioMultiPage({view,onChange,onDirtyChange}:{view:string;onChange:(value:string)=>boolean;onDirtyChange?:(dirty:boolean)=>void}){
 const [cmsDirty,setCmsDirty]=useState(false);
const [pages,setPages]=useState<Page[]>([]),[page,setPage]=useState<Page|null>(null),[chosen,setChosen]=useState<string>(""),[selected,setSelected]=useState<string|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[loading,setLoading]=useState(false);
 const activeRoute=routes.find(r=>r.name===view);
 const savedCustom=pages.find(p=>p.slug===page?.slug);
 const customDirty=!!page&&(page.revision===0||!!savedCustom&&JSON.stringify({
  slug:page.slug,title:page.title,description:page.description,published:page.published,blocks:page.blocks
 })!==JSON.stringify({
  slug:savedCustom.slug,title:savedCustom.title,description:savedCustom.description||"",published:savedCustom.published,blocks:savedCustom.blocks
 }));
 const hasPendingEdits=view==="Custom Page"?customDirty:cmsDirty;
 useEffect(()=>{onDirtyChange?.(hasPendingEdits);return()=>onDirtyChange?.(false);},[hasPendingEdits,onDirtyChange]);
 function confirmReplacement(){
  return !shouldConfirmCustomDraftReplacement(view==="Custom Page",customDirty)||window.confirm("Discard unsaved custom-page changes? They have not been saved or published.");
 }
 async function load(preserve=true){setLoading(true);try{const r=await fetch("/api/admin/content-pages",{cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to load pages");const all=d.pages as Page[];setPages(all||[]);if(preserve&&page?.slug){const updated=all.find(x=>x.slug===page.slug);if(updated)setPage({slug:updated.slug,title:updated.title,description:updated.description||"",published:updated.published,revision:updated.revision,blocks:updated.blocks.map(b=>({id:b.id,type:b.type,text:b.text}))});} }catch(e){setNotice("Error: "+String(e));}finally{setLoading(false);}}
 useEffect(()=>{void load(false);},[]);
 function choosePage(slug:string){const match=pages.find(p=>p.slug===slug);if(match){if(view==="Custom Page"&&!confirmReplacement())return;if(view!=="Custom Page"&&!onChange("Custom Page"))return;setPage({slug:match.slug,title:match.title,description:match.description||"",published:match.published,revision:match.revision,blocks:match.blocks.map(b=>({id:b.id,type:b.type,text:b.text}))});setSelected(null);setChosen(slug);setNotice("");}}
 function create(){if(view==="Custom Page"&&!confirmReplacement())return;if(view!=="Custom Page"&&!onChange("Custom Page"))return;setPage(blank());setSelected(null);setChosen("");setNotice("");}
 function patchBlock(id:string,props:Partial<Block>){if(!page)return;setPage({...page,blocks:page.blocks.map(b=>b.id===id?{...b,...props}:b)});}
 function move(index:number,d:number){if(!page||index+d<0||index+d>=page.blocks.length)return;const a=[...page.blocks];[a[index],a[index+d]]=[a[index+d],a[index]];setPage({...page,blocks:a});}
 function addBlock(type:Block["type"]){if(!page||page.blocks.length>=30)return;const block:Block={id:crypto.randomUUID(),type,text:type==="heading"?"New heading":type==="callout"?"New callout":"New paragraph"};setPage({...page,blocks:[...page.blocks,block]});setSelected(block.id);}
 async function save(){if(!page||busy)return;if(page.revision>0&&page.slug!==chosen){setNotice("Saved page slugs cannot be changed.");return;}if(page.published&&!window.confirm("Publish this page to /pages/"+page.slug+" now?"))return;setBusy(true);setNotice("");try{const r=await fetch("/api/admin/content-pages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(page)});const d=await r.json();if(!r.ok)throw Error(d.error||"Save failed");setPage({...page,revision:d.revision});setChosen(page.slug);setNotice("Saved revision "+d.revision+". "+(page.published?"Published":"Unpublished draft")+" at /pages/"+page.slug);await load(false);}catch(e){setNotice("Error: "+String(e));}finally{setBusy(false);}}
 const selectedBlock=useMemo(()=>page?.blocks.find(b=>b.id===selected)||null,[page,selected]);
 return <div className="smp-root">
  <div className="smp-top"><div><h2>Universal Page Workspace</h2><p>Choose an existing storefront route or create and edit a custom landing page.</p></div><div className="smp-actions"><button type="button" onClick={()=>void load(false)} disabled={loading}><RefreshCw size={15}/> Refresh</button><button type="button" onClick={create}><Plus size={15}/> New Custom Page</button></div></div>
  <div className="smp-bar"><label>Active page <select value={view==="Custom Page"?"custom":view} onChange={e=>{const v=e.target.value;if(onChange(v==="custom"?"Custom Page":v))setSelected(null);}}>
   <option value="Homepage">Homepage</option>{routes.map(r=><option key={r.name} value={r.name}>{r.name} ({r.path})</option>)}<option value="custom">Custom Page / Landing Page</option></select></label>
   <label>Saved custom pages <select value={chosen} onChange={e=>choosePage(e.target.value)}><option value="">Select a custom page…</option>{pages.map(p=><option key={p.slug} value={p.slug}>{p.title} — /pages/{p.slug}</option>)}</select></label>
   <span>{pages.length} custom page(s) · {hasPendingEdits?"Unsaved changes — save before switching":"No pending edits"}</span>
  </div>
  {activeRoute?<div className="smp-native-workspace">
    {(["Shop","Deals","Bundles","About","Contact","Journal","Cart","Checkout","Gift Cards","Pre-orders","Customer Stories","Wishlist","Routine Quiz","Track Order"].includes(activeRoute.name))&&<CmsPageSlotsEditor key={activeRoute.name} page={activeRoute.path.split("/").filter(Boolean)[0] as CmsSlotPage} onDirtyChange={setCmsDirty}/>}
    
   </div>:
   view==="Custom Page"?page?<div className="smp-columns">
    <section className="smp-list"><h3>Page Structure <span>{page.blocks.length} blocks</span></h3><div className="smp-items">{page.blocks.map((b,i)=><div className={"smp-item"+(selected===b.id?" active":"")} key={b.id}><button onClick={()=>setSelected(b.id)}><FileText size={14}/><span>{i+1}. {b.type} — {b.text.slice(0,20)}</span></button><button title="Move up" disabled={i===0} onClick={()=>move(i,-1)}><ArrowUp size={14}/></button><button title="Move down" disabled={i===page.blocks.length-1} onClick={()=>move(i,1)}><ArrowDown size={14}/></button></div>)}</div><h4>Block Library</h4><div className="smp-library">{(["heading","paragraph","callout"] as const).map(type=><button key={type} onClick={()=>addBlock(type)}><Plus size={14}/>{type}</button>)}</div></section>
    <section className="smp-preview"><div className="smp-browser"><span>Page Preview (unsaved changes)</span><a target="_blank" rel="noreferrer" href={page.slug?"/pages/"+page.slug:"#"}>Published URL <ExternalLink size={12}/></a></div><article><p className="smp-kicker">ANUSMITA · FASHION · BEAUTY</p><h1>{page.title}</h1>{page.blocks.map(b=><button className={"smp-preview-block"+(selected===b.id?" selected":"")} type="button" onClick={()=>setSelected(b.id)} key={b.id}>{b.type==="heading"?<h2>{b.text}</h2>:b.type==="callout"?<aside>{b.text}</aside>:<p>{b.text}</p>}</button>)}</article></section>
    <section className="smp-inspector"><h3>Page Settings</h3><label>Page title<input maxLength={100} value={page.title} onChange={e=>setPage({...page,title:e.target.value})}/></label><label>Slug (under /pages/)<input disabled={page.revision>0} maxLength={80} value={page.slug} placeholder="eid-collection" onChange={e=>setPage({...page,slug:e.target.value.toLowerCase()})}/></label><label>SEO description<textarea maxLength={160} value={page.description} onChange={e=>setPage({...page,description:e.target.value})}/></label><label className="smp-published"><input type="checkbox" checked={page.published} onChange={e=>setPage({...page,published:e.target.checked})}/> Publish page</label><p className="smp-meta">Revision: {page.revision}. Draft changes stay local until Save. Publishing changes only /pages/{page.slug||"slug"}.</p>
     {selectedBlock&&<div className="smp-block-editor"><h3>Selected {selectedBlock.type}</h3><label>Block type<select value={selectedBlock.type} onChange={e=>patchBlock(selectedBlock.id,{type:e.target.value as Block["type"]})}><option>heading</option><option>paragraph</option><option>callout</option></select></label><label>Text<textarea rows={5} maxLength={3000} value={selectedBlock.text} onChange={e=>patchBlock(selectedBlock.id,{text:e.target.value})}/></label><div className="smp-actions"><button onClick={()=>{if(page.blocks.length>1){setPage({...page,blocks:page.blocks.filter(b=>b.id!==selectedBlock.id)});setSelected(null);}}} disabled={page.blocks.length<=1}><Trash2 size={14}/> Remove</button><button disabled={page.blocks.length>=30} onClick={()=>addBlock(selectedBlock.type)}><Copy size={14}/> Add similar</button></div></div>}
     <button className="smp-save" onClick={()=>void save()} disabled={busy}><Save size={15}/>{busy?"Saving…":"Save Page"}</button></section>
   </div>:<div className="smp-empty"><LayoutGrid size={30}/><h3>Choose a custom page or create a new one</h3><p>Published custom pages are available at /pages/slug. Home, shop and commerce routes remain separate.</p><button onClick={create}><Plus size={15}/> Create Page</button></div>:null}
  {notice&&<p className="smp-notice" role="status">{notice}</p>}
 </div>;
}
