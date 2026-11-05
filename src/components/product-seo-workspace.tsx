"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {useSearchParams} from "next/navigation";
import {Activity,ArrowDown,ArrowLeft,ArrowRight,BarChart3,Check,CheckCircle2,ChevronDown,Clipboard,Code2,ExternalLink,FileCode2,FileText,Globe,Image as ImageIcon,Layers,Link2,Loader2,Monitor,PanelRightOpen,RefreshCw,Save,Search,Settings2,ShieldCheck,Smartphone,Sparkles,Tag,Target,Upload, XCircle} from "lucide-react";
import {analyzeSeo,autoSeo,canonical,cleanText,localScore,makeProductSchema,type SeoFacts,type SeoFields} from "@/lib/product-seo-audit";
import "./product-seo-workspace.css";
type Product=SeoFacts&{id:string};
type Seo=SeoFields&{revision:number};
type Item={_id:string;name:string;slug:string;sku:string;category:string;active:boolean;imageUrls?:string[]};
type Tab="overview"|"meta"|"schema"|"media"|"advanced"|"audit"|"history";
type Platform="google"|"facebook"|"x";
const tabs:[Tab,string,typeof Layers][]=[["overview","SEO Overview",Layers],["meta","Meta & Content",FileText],["schema","Schema Markup",Code2],["media","Media & Social",ImageIcon],["advanced","Advanced",Settings2],["audit","Audit & Analyzer",Activity],["history","History & Redirects",RefreshCw]];
const external=(url:string)=>window.open(url,"_blank","noopener,noreferrer");
export default function ProductSeoWorkspace({canEdit=true}:{canEdit?:boolean}){
 const params=useSearchParams();
 const [products,setProducts]=useState<Item[]>([]),[total,setTotal]=useState(0),[page,setPage]=useState(1),[pages,setPages]=useState(1);
 const [query,setQuery]=useState(params.get("q")||""),[category,setCategory]=useState("all"),[categories,setCategories]=useState<string[]>([]);
 const [catalogOpen,setCatalogOpen]=useState(false),[tab,setTab]=useState<Tab>("overview"),[platform,setPlatform]=useState<Platform>("google"),[device,setDevice]=useState<"desktop"|"mobile">("desktop");
 const [product,setProduct]=useState<Product|null>(null),[seo,setSeo]=useState<Seo|null>(null),[saved,setSaved]=useState<Seo|null>(null);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[notice,setNotice]=useState(""),[keyword,setKeyword]=useState("");
 const searchId=useRef(0),selectionId=useRef(0);
 const checks=useMemo(()=>product&&seo?analyzeSeo(product,seo):[],[product,seo]);
 const grade=localScore(checks),done=checks.filter(c=>c.ok).length;
 const dirty=!!seo&&!!saved&&JSON.stringify(seo)!==JSON.stringify(saved);
 const fallback=product?autoSeo(product):null;
 const title=seo?.metaTitle.trim()||product?.name||"",desc=seo?.metaDescription.trim()||product?.description?.slice(0,160)||"";
 const url=product?canonical(product.slug):"";
 const words=product?cleanText(product.description).split(/\s+/).filter(Boolean):[];
 const focus=seo?.focusKeyword.trim().toLowerCase()||"";
 const instances=focus&&product?cleanText(product.description).toLowerCase().split(focus).length-1:0;
 const density=focus&&words.length?Math.round((instances/words.length)*1000)/10:0;
 const schema=product&&seo?makeProductSchema(product,seo):null;
 function change<K extends keyof Seo>(field:K,value:Seo[K]){setSeo(current=>current?{...current,[field]:value}:current);}
 async function choose(id:string){
  if(dirty&&!window.confirm("Discard unsaved SEO changes before switching products?"))return;
  const request=++selectionId.current;setLoading(true);setNotice("");
  try{
   const response=await fetch("/api/admin/product-seo?productId="+encodeURIComponent(id),{cache:"no-store"});
   const json=await response.json();if(!response.ok)throw Error(json.error||"Cannot load product SEO");
   if(request!==selectionId.current)return;
   setProduct(json.product);setSeo(json.seo);setSaved(structuredClone(json.seo));setCatalogOpen(false);setTab("overview");setNotice("");
  }catch(error){if(request===selectionId.current)setNotice(String(error));}
  finally{if(request===selectionId.current)setLoading(false);}
 }
 async function loadCatalog(nextPage=1,search=query,cat=category){
  const id=++searchId.current;
  try{
   const res=await fetch("/api/admin/products?"+new URLSearchParams({page:String(nextPage),perPage:"10",q:search,category:cat,status:"all"}),{cache:"no-store"});
   const json=await res.json();if(!res.ok)throw Error(json.error||"Cannot load catalog");
   if(id!==searchId.current)return;
   const list:Item[]=json.products||[];
   setProducts(list);setPage(nextPage);setPages(Math.max(1,json.pages||1));setTotal(Number(json.total||0));setCategories(json.categories||[]);
   if(list[0]&&!product)void choose(list[0]._id);
  }catch(error){if(id===searchId.current)setNotice(String(error));}
 }
 useEffect(()=>{void loadCatalog(1);},[]);
 useEffect(()=>{if(!dirty)return;const guard=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};window.addEventListener("beforeunload",guard);return()=>window.removeEventListener("beforeunload",guard);},[dirty]);
 async function save(event?:React.FormEvent){
  event?.preventDefault();if(!product||!seo||busy||!canEdit)return;
  setBusy(true);setNotice("");
  try{
   const result=await fetch("/api/admin/product-seo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...seo,productId:product.id})});
   const json=await result.json();if(!result.ok)throw Error(json.error||"Failed to save SEO");
   const updated={...seo,revision:Number(json.revision)};setSeo(updated);setSaved(structuredClone(updated));setNotice("Saved and audited — revision "+json.revision+". Verify the public product page after refreshing.");
  }catch(error){setNotice("Save error: "+String(error));}
  finally{setBusy(false);}
 }
 function generate(){
  if(!product||!seo)return;
  if(!canEdit)return;const a=autoSeo(product);
  setSeo({...seo,metaTitle:a.title,metaDescription:a.description,focusKeyword:a.focus,ogTitle:a.title,ogDescription:a.description});
  setNotice("Factual SEO draft generated from saved product details. Review and Save Changes to persist; no AI provider was called.");
  setTab("meta");
 }
 function addKeyword(){
  if(!seo)return;const value=keyword.trim();if(!value)return;
  if(seo.keywords.length>=15){setNotice("Maximum 15 keywords");return;}
  if(!seo.keywords.some(k=>k.toLowerCase()===value.toLowerCase()))change("keywords",[...seo.keywords,value]);
  setKeyword("");
 }
 const input=(name:string,value:string,max:number,onChange:(v:string)=>void,placeholder="")=><label className="ep-field">{name}<span>{value.length}/{max}</span><input value={value} maxLength={max} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/></label>;
 const longInput=(name:string,value:string,max:number,onChange:(v:string)=>void,placeholder="")=><label className="ep-field">{name}<span>{value.length}/{max}</span><textarea rows={3} value={value} maxLength={max} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/></label>;
 const information=<section className="ep-card ep-fields"><h3><FileText size={16}/> Key SEO Information</h3>
  {input("Meta Title",seo?.metaTitle||"",70,v=>change("metaTitle",v),fallback?.title)}
  {longInput("Meta Description",seo?.metaDescription||"",160,v=>change("metaDescription",v),fallback?.description)}
  <label className="ep-field">URL Slug<small>Managed in Product Editor</small><input readOnly value={product?.slug||""}/></label>
  <label className="ep-field">Canonical URL<small>Actual public route</small><input readOnly value={url}/></label>
  <div className="ep-keywords"><label>Focus Keywords</label><div>{seo?.keywords.map(k=><button type="button" key={k} onClick={()=>change("keywords",seo.keywords.filter(x=>x!==k))}>{k} ×</button>)}</div><form onSubmit={e=>{e.preventDefault();addKeyword();}}><input maxLength={80} value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="Enter keyword"/><button type="submit">+ Add keyword</button></form></div>
 </section>;
 const keywordPanel=<section className="ep-card ep-keyword"><h3><Target size={16}/> Target Keyword Analysis</h3>
   {input("Primary Keyword",seo?.focusKeyword||"",80,v=>change("focusKeyword",v),"Relevant search phrase")}
   <div className="ep-data-line"><span>Content word count</span><strong>{words.length}</strong></div>
   <div className="ep-data-line"><span>Keyword occurrences</span><strong>{instances}</strong></div>
   <div className="ep-data-line"><span>Approx. phrase frequency</span><strong>{density}%</strong></div>
   <div className="ep-meter"><span style={{width:Math.min(100,density*30)+"%"}}/></div>
   <p className="ep-small">Local content analysis only. Search volume, competition, CPC and live rankings need verified external data and are not invented.</p>
 </section>;
 const tabContents=tab==="overview"?<><div className="ep-preview-section"><h3><Clipboard size={17}/> SEO Overview & Live Preview</h3><p>Preview reflects the current draft. Public metadata changes only after saving.</p>
    <div className="ep-preview-tools"><div>{(["google","facebook","x"] as const).map((p)=><button type="button" className={platform===p?"active":""} key={p} onClick={()=>setPlatform(p)}>{p==="google"?"🌐 Google Search Preview":p==="facebook"?"ⓕ Facebook / Open Graph":"𝕏 Twitter (X) Card"}</button>)}</div><div><button type="button" aria-pressed={device==="desktop"} onClick={()=>setDevice("desktop")}><Monitor size={15}/></button><button type="button" aria-pressed={device==="mobile"} onClick={()=>setDevice("mobile")}><Smartphone size={15}/></button></div></div>
    <div className={"ep-search-preview"+(device==="mobile"?" compact":"")}>{platform==="google"?<><small><Globe size={13}/> anusmita.netlify.app › products › {product?.slug}</small><strong>{title||"Add a product SEO title"}</strong><p>{desc||"Add an informative meta description."}</p></>:<><div className="ep-social-card">{product?.imageUrls[0]&&<img src={product.imageUrls[0]} alt="Product social preview"/>}<div><small>ANUSMITA.NETLIFY.APP</small><strong>{seo?.ogTitle||title}</strong><p>{seo?.ogDescription||desc}</p></div></div></>}</div>
  </div><div className="ep-dual">{information}{keywordPanel}</div></>:tab==="meta"?<div className="ep-dual">{information}{keywordPanel}</div>:tab==="schema"?<section className="ep-card"><h3><FileCode2 size={17}/> Factual Product Structured Data</h3><p>JSON-LD preview generated from current product details; no fabricated reviews, ratings or GTIN.</p><label className="ep-check"><input type="checkbox" checked={seo?.schemaEnabled||false} onChange={e=>change("schemaEnabled",e.target.checked)}/> Enable Product Schema on public product page</label><pre className="ep-code">{JSON.stringify(schema,null,2)}</pre><button className="ep-outline" type="button" onClick={()=>schema&&navigator.clipboard?.writeText(JSON.stringify(schema,null,2))}><Clipboard size={14}/> Copy JSON-LD</button><button className="ep-outline" type="button" onClick={()=>external("https://search.google.com/test/rich-results?url="+encodeURIComponent(url))}><ExternalLink size={14}/> Test public URL with Google</button></section>:tab==="media"?<div className="ep-media-stack"><section className="ep-card"><h3><ImageIcon size={17}/> Product Image SEO</h3><p>Image URLs are managed in Product Editor; describe only visible product details.</p>{product?.imageUrls.length?product.imageUrls.map((u,i)=><div className="ep-media-row" key={i}><img src={u} alt="Product preview"/>{input("Image "+(i+1)+" alt text",seo?.imageAltTexts[i]||"",160,v=>{if(!seo)return;const next=[...seo.imageAltTexts];next[i]=v;change("imageAltTexts",next);})}</div>):<p>No product images uploaded.</p>}</section><section className="ep-card"><h3><Globe size={17}/> Social Metadata</h3>{input("Open Graph Title",seo?.ogTitle||"",70,v=>change("ogTitle",v))}{longInput("Social Description",seo?.ogDescription||"",160,v=>change("ogDescription",v))}</section></div>:tab==="advanced"?<section className="ep-card"><h3><Settings2 size={17}/> Advanced SEO Controls</h3><p>Index flags are subject to site-wide catalog/checkout launch policy; toggles do not force Google indexing.</p><label className="ep-check"><input type="checkbox" checked={seo?.robotsIndex||false} onChange={e=>change("robotsIndex",e.target.checked)}/> Request search-engine indexing</label><label className="ep-check"><input type="checkbox" checked={seo?.robotsFollow||false} onChange={e=>change("robotsFollow",e.target.checked)}/> Follow public links</label><label className="ep-check"><input type="checkbox" checked={seo?.schemaEnabled||false} onChange={e=>change("schemaEnabled",e.target.checked)}/> Enable factual product JSON-LD</label><p className="ep-small">Slug edits, redirect rules, variants, inventory, and publication are managed in their existing specialized modules to avoid duplicates.</p><a className="ep-outline" href="/admin/products/manage">Open Product Editor <ExternalLink size={14}/></a></section>:tab==="audit"?<section className="ep-card"><h3><Activity size={17}/> Live Editorial SEO Audit</h3><p>Heuristic score: {grade}/100. Not Google ranking, indexing verification or Search Console data.</p><div className="ep-audit-list">{checks.map(c=><div key={c.id}><span className={c.ok?"good":"todo"}>{c.ok?<CheckCircle2 size={17}/>:<XCircle size={17}/>}</span><div><strong>{c.label}</strong><small>{c.detail}</small></div></div>)}</div></section>:<section className="ep-card"><h3><RefreshCw size={17}/> History & Redirects</h3><p>Current saved SEO revision: <strong>{seo?.revision??0}</strong>.</p><p>The existing audited API records updates and blocks concurrent edits. Full historical snapshots and 301 redirect management are not implemented here; changing a product slug without a redirect can break inbound links.</p><button type="button" className="ep-outline" onClick={()=>product&&void choose(product.id)}><RefreshCw size={14}/> Reload saved SEO</button><a className="ep-outline" href="/admin/products/manage">Manage product slug <ExternalLink size={14}/></a></section>;
 return <section className="ep-workspace" aria-label="Product SEO workspace">
  <div className="ep-toolbar"><div><span className="ep-eyebrow"><Layers size={19}/> PRODUCT SEO WORKSPACE <b>PRO</b></span><p>Advanced product metadata, content quality, schema inspection and real-time previews.</p></div><div className="ep-toolbar-actions"><button type="button" className="ep-outline" onClick={()=>setCatalogOpen(v=>!v)}><Search size={15}/> Select product</button><button className="ep-outline" type="button" onClick={()=>setTab("advanced")}><Settings2 size={15}/> SEO Settings</button><button className="ep-primary" onClick={()=>void save()} type="button" disabled={!canEdit||!dirty||busy||!product}>{busy?<Loader2 size={15}/>:<Save size={15}/>} {busy?"Saving…":"Save Changes"}</button></div></div>
  {!canEdit&&<div className="ep-notice" role="status">Read-only SEO access: you need Product Edit permission to save changes.</div>}{notice&&<div role="status" className="ep-notice">{notice}<button type="button" aria-label="Dismiss message" onClick={()=>setNotice("")}>×</button></div>}
  {catalogOpen&&<div className="ep-catalog"><div className="ep-catalog-head"><strong>Select product</strong><span>{total} catalog products · 10/page</span><button type="button" onClick={()=>setCatalogOpen(false)}>Close ×</button></div><form onSubmit={e=>{e.preventDefault();void loadCatalog(1);}}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search real products / SKU"/><select value={category} onChange={e=>{setCategory(e.target.value);void loadCatalog(1,query,e.target.value);}}><option value="all">All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select><button type="submit">Search</button></form><div className="ep-catalog-grid">{products.map(p=><button key={p._id} className={product?.id===p._id?"chosen":""} onClick={()=>void choose(p._id)}>{p.imageUrls?.[0]&&<img src={p.imageUrls[0]} alt=""/>}<span><b>{p.name}</b><small>{p.sku} · {p.active?"Published":"Draft"}</small></span></button>)}</div><div className="ep-pager"><button disabled={page===1} onClick={()=>void loadCatalog(page-1)}><ArrowLeft size={14}/> Prev</button><span>{page} / {pages}</span><button disabled={page===pages} onClick={()=>void loadCatalog(page+1)}>Next <ArrowRight size={14}/></button></div></div>}
  {product&&seo?<><div className="ep-product-header">{product.imageUrls[0]?<img src={product.imageUrls[0]} alt="Product cover"/>:<div className="ep-no-image"><ImageIcon size={30}/></div>}<div className="ep-product-text"><h2>{product.name}</h2><p>SKU: {product.sku} <i/> Status: <span className={product.active?"ep-active":"ep-draft"}>{product.active?"Active":"Draft"}</span></p><p>Category: {product.category}　 |　 Brand: {product.brand||"ANUSMITA"}</p></div><div className="ep-product-links"><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/> Open in Store</a><a href="/admin/products/manage">Edit Product</a></div></div>
  <div className="ep-tabs" role="tablist" aria-label="Product SEO sections">{tabs.map(([id,label,Icon])=><button type="button" role="tab" aria-selected={tab===id} className={tab===id?"active":""} key={id} onClick={()=>setTab(id)}><Icon size={15}/>{label}</button>)}</div>
  <div className="ep-body"><aside className="ep-left"><section className="ep-card ep-progress"><h3>SEO Setup Progress</h3><p>{done}/{checks.length} checks · {grade}%</p><div className="ep-meter"><span style={{width:grade+"%"}}/></div><div className="ep-check-list">{checks.map(check=><button type="button" key={check.id} title={check.detail} onClick={()=>setTab(check.id==="image"||check.id==="social"?"media":check.id==="schema"?"schema":check.id==="robots"?"advanced":"audit")}><span className={check.ok?"good":"todo"}>{check.ok?<Check size={13}/>:<XCircle size={13}/>}</span>{check.label}</button>)}</div></section></aside>
  <main className="ep-center">{tabContents}<div className="ep-mobile-save"><button className="ep-primary" type="button" disabled={!canEdit||!dirty||busy} onClick={()=>void save()}><Save size={15}/> Save Changes</button>{dirty&&<span>Unsaved changes</span>}</div></main>
  <aside className="ep-right"><section className="ep-card ep-score"><h3>SEO Score <span title="Local checklist, not a ranking prediction">ⓘ</span></h3><div className="ep-score-content"><div className="ep-score-ring" style={{background:"conic-gradient(#33b56a "+grade+"%,#e8e5e5 0)"}}><div><strong>{grade}<small>/100</small></strong><span>{grade>=80?"Good":grade>=50?"Improve":"Needs work"}</span></div></div><div className="ep-score-categories">{["Meta & Content","Schema Markup","Media & Social","Technical SEO","Content Quality"].map((label,i)=><p key={label}><CheckCircle2 size={14} color={i<Math.floor(grade/20)?"#25a961":"#b4a4a9"}/>{label}</p>)}</div></div></section>
   <section className="ep-card ep-quick"><h3>Quick Actions</h3><div><button type="button" onClick={generate}><Sparkles size={17}/> Generate SEO</button><button type="button" onClick={()=>setTab("meta")}><FileText size={17}/> Optimize Content</button><button type="button" onClick={()=>setTab("schema")}><Code2 size={17}/> Generate Schema</button><button type="button" onClick={()=>setTab("media")}><ImageIcon size={17}/> OG Image / Alt</button><button type="button" onClick={()=>external("https://www.google.com/search?q="+encodeURIComponent("site:"+url))}><Search size={17}/> Search on Google</button><button type="button" onClick={()=>external("https://search.google.com/test/rich-results?url="+encodeURIComponent(url))}><ShieldCheck size={17}/> Test Schema</button></div></section>
   <section className="ep-card ep-insights"><h3>Product Insights</h3><dl><div><dt>Description words</dt><dd>{words.length}</dd></div><div><dt>Images</dt><dd>{product.imageUrls.length}</dd></div><div><dt>Current stock</dt><dd>{Math.max(0,Number(product.onHand||0)-Number(product.reserved||0))}</dd></div><div><dt>JSON-LD</dt><dd>{seo.schemaEnabled?"Enabled":"Disabled"}</dd></div><div><dt>Index request</dt><dd>{seo.robotsIndex?"Allowed*":"Noindex"}</dd></div></dl><small>*Site-wide launch restrictions may override this choice.</small></section>
   <section className="ep-card ep-health"><h3>SEO Health Checks</h3>{checks.slice(0,8).map(check=><p key={check.id}><span className={check.ok?"good":"todo"}>{check.ok?<CheckCircle2 size={15}/>:<XCircle size={15}/>}</span>{check.label}</p>)}</section>
  </aside></div></>:<div className="ep-empty">{loading?<><Loader2 size={22}/> Loading SEO data…</>:<>Select a saved catalog product to begin. <button className="ep-outline" onClick={()=>setCatalogOpen(true)}>Choose product</button></>}</div>}
 </section>;
}
