"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {Plus,Save,Upload,Trash2,ArrowUp,ArrowDown,Eye,EyeOff,RefreshCw} from "lucide-react";
import {cmsSlotSchema,defaultCmsStyle,cmsSectionKinds,cmsNativeHeroSchema,defaultCmsNativeHero,type CmsNativeHero,type CmsSlot,type CmsSlotPage} from "@/lib/cms-page-slots";
import "./cms-page-slots-editor.css";
type Payload={page:CmsSlotPage;revision:number;publishedRevision:number;draft:CmsSlot[];published:CmsSlot[];publishedAt:string|null;nativeDraft:CmsNativeHero;nativePublished:CmsNativeHero};
const fresh=(position:number,kind:CmsSlot["kind"]="banner"):CmsSlot=>({id:crypto.randomUUID(),placement:"before",kind,style:{...defaultCmsStyle},title:"New ANUSMITA Collection",subtitle:"Discover what is new and thoughtfully curated.",badge:"ANUSMITA EDIT",imageUrl:"",cta:"Explore Collection",href:"/shop",enabled:true,position});
export default function CmsPageSlotsEditor({page,onPublished}:{page:CmsSlotPage;onPublished?:()=>void}){
 const jsonInput=useRef<HTMLInputElement|null>(null);
 const mediaInput=useRef<HTMLInputElement|null>(null);
 const nativeMediaInput=useRef<HTMLInputElement|null>(null);
 const [native,setNative]=useState<CmsNativeHero>(defaultCmsNativeHero);
 const [mediaBusy,setMediaBusy]=useState(false);
 const [createKind,setCreateKind]=useState<CmsSlot["kind"]>("banner");
 const [inspectorTab,setInspectorTab]=useState<"content"|"design"|"publish">("content");
 const [record,setRecord]=useState<Payload|null>(null),[slots,setSlots]=useState<CmsSlot[]>([]),[selected,setSelected]=useState<string|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[mode,setMode]=useState<"draft"|"published">("draft");
 const load=useCallback(async()=>{const r=await fetch("/api/admin/cms-page-slots?page="+encodeURIComponent(page),{cache:"no-store"});const j=await r.json();if(!r.ok)throw Error(j.error||"Could not fetch CMS slots");const parsed=cmsSlotSchema.array().max(20).parse(j.draft);const nativeParsed=cmsNativeHeroSchema.parse(j.nativeDraft||{});setRecord({...j,draft:parsed,nativeDraft:nativeParsed,nativePublished:cmsNativeHeroSchema.parse(j.nativePublished||{})});setNative(nativeParsed);setSlots(parsed);setSelected(null);setNotice("");},[page]);
 useEffect(()=>{void load().catch(e=>setNotice("Error: "+String(e)));},[load]);
 const selectedSlot=slots.find(s=>s.id===selected);
 function exportJson(){
  const blob=new Blob([JSON.stringify({format:"anusmita-cms-slots",version:1,page,slots},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=page+"-cms-sections.json";a.click();URL.revokeObjectURL(url);
 }
 async function uploadImage(file:File,target:"block"|"native"="block"){
  if(target==="block"&&!selectedSlot){setNotice("Select a section first.");return;}
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size<=0||file.size>3*1024*1024){setNotice("Choose a JPEG, PNG or WebP image under 3 MB.");return;}
  const targetId=selectedSlot?.id;
  setMediaBusy(true);setNotice("Uploading CMS image…");
  try{
   const form=new FormData();form.set("page",page);form.set("file",file);
   const r=await fetch("/api/admin/cms-page-slots/media",{method:"POST",body:form});
   const data=await r.json();if(!r.ok)throw Error(data.error||"Upload failed");
   if(target==="native")setNative(v=>({...v,imageUrl:data.url}));else setSlots(old=>old.map(x=>x.id===targetId?{...x,imageUrl:data.url}:x));
   setNotice("Image uploaded to R2 and added to the unsaved section. Save Draft and Publish to make it public.");
  }catch(e){setNotice("Upload failed: "+(e instanceof Error?e.message:String(e)));}
  finally{setMediaBusy(false);}
 }
 async function importJson(file:File){
  if(file.size>100000){setNotice("Import rejected: file must be under 100 KB");return;}
  try{
   const data=JSON.parse(await file.text());
   if(data?.format!=="anusmita-cms-slots"||data.version!==1||data.page!==page)throw Error("Invalid export or wrong page");
   const validated=cmsSlotSchema.array().max(20).parse(data.slots);
   if(dirty&&!window.confirm("Replace your current unsaved draft with the imported sections?"))return;
   setSlots(validated.map((s,i)=>({...s,id:crypto.randomUUID(),position:i})));setSelected(null);setNotice("Imported "+validated.length+" safe CMS sections as an unsaved draft. Review and Save Draft before publishing.");
  }catch(e){setNotice("Import rejected: "+(e instanceof Error?e.message:String(e)));}
 }

 function update(changes:Partial<CmsSlot>){if(!selectedSlot)return;setSlots(old=>old.map(s=>s.id===selected?{...s,...changes}:s));}
 const dirty=!!record&&(JSON.stringify(slots)!==JSON.stringify(record.draft)||JSON.stringify(native)!==JSON.stringify(record.nativeDraft));
 useEffect(()=>{if(!dirty)return;const guard=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue="";};window.addEventListener("beforeunload",guard);return()=>window.removeEventListener("beforeunload",guard);},[dirty]);
 function add(){const item=fresh(slots.length,createKind);setSlots(prev=>[...prev,item]);setSelected(item.id);setMode("draft");}
 function copySlot(id:string){const item=slots.find(x=>x.id===id);if(!item||slots.length>=20)return;const next={...item,id:crypto.randomUUID(),position:slots.length};setSlots(old=>[...old,next]);setSelected(next.id);}
 function updateStyle(changes:Partial<CmsSlot["style"]>){if(!selectedSlot)return;update({style:{...selectedSlot.style,...changes}});}
 function move(id:string,dir:number){const arr=[...slots];const i=arr.findIndex(x=>x.id===id),j=i+dir;if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];setSlots(arr.map((s,index)=>({...s,position:index})));}
 async function save(action:"saveDraft"|"publish"){if(!record||busy)return;const valid=cmsSlotSchema.array().max(20).safeParse(slots);const nativeValid=cmsNativeHeroSchema.safeParse(native);if(!nativeValid.success){setNotice("Hero validation: "+nativeValid.error.issues.map(i=>i.message).join("; "));return;}if(!valid.success){setNotice("Validation: "+valid.error.issues.map(i=>i.message).join("; "));return;}
  if(action==="publish"&&!window.confirm("Publish "+slots.length+" editorial block(s) to /"+page+"? Existing native storefront interactions will remain untouched."))return;
  setBusy(true);setNotice("");
  try{const r=await fetch("/api/admin/cms-page-slots",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({page,revision:record.revision,action,slots:valid.data,nativeHero:nativeValid.data})});const j=await r.json();if(!r.ok)throw Error(j.error||"Save failed");const nextNative=cmsNativeHeroSchema.parse(j.nativeDraft||{});setRecord({...j,nativeDraft:nextNative,nativePublished:cmsNativeHeroSchema.parse(j.nativePublished||{})});setNative(nextNative);setSlots(cmsSlotSchema.array().max(20).parse(j.draft));setNotice(action==="publish"?"Published revision "+j.publishedRevision+". Reload page preview to view your changes.":"Draft revision "+j.revision+" saved. Public page unchanged.");if(action==="publish")onPublished?.();
  }catch(e){setNotice("Error: "+String(e));}finally{setBusy(false);}
 }
 if(!record)return <div className="cse-empty" role="status">{notice||"Loading "+page+" CMS slots…"}</div>;
 return <div className="cse-root"><div className="cse-heading"><div><h3>Editable {page} page slots</h3><p>Add banners, text and curated CTA sections without altering the existing storefront logic.</p></div><span>Draft r{record.revision} · Live r{record.publishedRevision}</span></div>
  {(["bundles","deals","about","contact","journal"] as string[]).includes(page)&&<div className="cse-native-hero">
   <div><h4>Native Page Hero — {page}</h4><p className="cse-muted">Override the existing hero title, subtitle, photo and colors. Leave fields blank to keep the original. Existing forms, product information and interactive sections stay unchanged.</p></div>
   <div className="cse-native-fields">
    <label>Hero title<input value={native.title} maxLength={130} placeholder="Keep original title" onChange={e=>setNative(n=>({...n,title:e.target.value}))}/></label>
    <label>Hero subtitle<textarea value={native.subtitle} rows={2} maxLength={320} placeholder="Keep original subtitle" onChange={e=>setNative(n=>({...n,subtitle:e.target.value}))}/></label>
    <label>Hero image URL<input value={native.imageUrl} maxLength={500} placeholder="Keep existing image" onChange={e=>setNative(n=>({...n,imageUrl:e.target.value}))}/></label>
    <div className="cse-media-upload"><input type="file" hidden ref={nativeMediaInput} accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.currentTarget.files?.[0];if(file)void uploadImage(file,"native");e.currentTarget.value="";}}/><button type="button" disabled={mediaBusy} onClick={()=>nativeMediaInput.current?.click()}>{mediaBusy?"Uploading…":"Upload hero image"}</button></div>
    <label>Hero background<div className="cse-color-control"><input type="color" value={native.background} onChange={e=>setNative(n=>({...n,background:e.target.value}))}/><input maxLength={7} value={native.background} onChange={e=>setNative(n=>({...n,background:e.target.value}))}/></div></label>
    <label>Hero text color<div className="cse-color-control"><input type="color" value={native.textColor} onChange={e=>setNative(n=>({...n,textColor:e.target.value}))}/><input maxLength={7} value={native.textColor} onChange={e=>setNative(n=>({...n,textColor:e.target.value}))}/></div></label>
   </div>
   <p className="cse-muted">Native hero changes go live only when you click Publish Page Slots. Save Draft preserves the current public hero.</p>
  </div>}
  <div className="cse-workspace"><section className="cse-list"><div className="cse-section-head"><strong>Page sections ({slots.length})</strong><div className="cse-add-control"><select aria-label="Section type to add" value={createKind} onChange={e=>setCreateKind(e.target.value as CmsSlot["kind"])}>{cmsSectionKinds.map(t=><option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>)}</select><button onClick={add} disabled={slots.length>=20}><Plus size={14}/> Add</button></div></div>
   {slots.length===0&&<p className="cse-muted">No custom sections yet. The original page remains visible.</p>}
   {slots.map((s,i)=><div key={s.id} className={"cse-row"+(selected===s.id?" active":"")}><button onClick={()=>setSelected(s.id)}><span>{i+1}.</span><span>{s.title}</span></button><small>{s.kind}</small><button title="Duplicate section" disabled={slots.length>=20} onClick={()=>copySlot(s.id)}>⧉</button><button title="Move up" disabled={i===0} onClick={()=>move(s.id,-1)}><ArrowUp size={13}/></button><button title="Move down" disabled={i===slots.length-1} onClick={()=>move(s.id,1)}><ArrowDown size={13}/></button></div>)}
   <p className="cse-muted">Before and After indicate placement around the original page. Existing native page elements are protected.</p>
  </section>
  <section className="cse-canvas"><div className="cse-preview-head"><strong>CMS block preview</strong><span>Unsaved draft</span></div>
   {slots.map(s=><button key={s.id} className={"cse-preview-card cse-preview-"+s.kind+(selected===s.id?" active":"")} style={{background:s.style.background,color:s.style.textColor,borderRadius:s.style.radius}} onClick={()=>setSelected(s.id)}>
    <div style={{padding:s.style.padding,textAlign:s.style.alignment}}><small>{s.badge||"ANUSMITA"}</small><h3 style={{fontSize:s.style.fontSize,color:s.style.textColor}}>{s.title}</h3><p>{s.subtitle}</p>{s.cta&&<em style={{background:s.style.accentColor,borderRadius:Math.min(s.style.radius,24)}}>{s.cta} →</em>}</div>{s.imageUrl&&<img src={s.imageUrl} alt=""/>}
    <span className="cse-flag">{s.enabled?"Visible":"Hidden"} · {s.placement}</span></button>)}
   {!slots.length&&<p className="cse-empty-preview">Use Add to start editing this page.</p>}
  </section>
  <section className="cse-inspector"><h3>Section Settings</h3>
   <div className="cse-inspector-tabs" role="group" aria-label="Inspector panels">{(["content","design","publish"] as const).map(t=><button type="button" key={t} className={inspectorTab===t?"active":""} onClick={()=>setInspectorTab(t)}>{t}</button>)}</div>
   {selectedSlot?<>{inspectorTab==="content"&&<>
    <label>Block type<select value={selectedSlot.kind} onChange={e=>update({kind:e.target.value as CmsSlot["kind"]})}>{cmsSectionKinds.map(t=><option key={t} value={t}>{t}</option>)}</select></label>
    <label>Title<input value={selectedSlot.title} maxLength={110} onChange={e=>update({title:e.target.value})}/></label>
    <label>Subtitle<textarea rows={4} maxLength={400} value={selectedSlot.subtitle} onChange={e=>update({subtitle:e.target.value})}/></label>
    <label>Badge<input value={selectedSlot.badge} maxLength={60} onChange={e=>update({badge:e.target.value})}/></label>
    <label>Image URL<input value={selectedSlot.imageUrl} maxLength={500} placeholder="/brand/categories/skincare.webp" onChange={e=>update({imageUrl:e.target.value})}/></label>
    <div className="cse-media-upload"><input type="file" hidden ref={mediaInput} accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.currentTarget.files?.[0];if(file)void uploadImage(file);e.currentTarget.value="";}}/><button type="button" disabled={mediaBusy} onClick={()=>mediaInput.current?.click()}>{mediaBusy?"Uploading…":"Upload CMS image to R2"}</button></div><p className="cse-muted">JPEG/PNG/WebP, maximum 3 MB. Upload creates a new CMS asset and does not touch product photos. Save Draft and Publish to use it.</p>
    <label>Button label<input value={selectedSlot.cta} maxLength={48} onChange={e=>update({cta:e.target.value})}/></label>
    <label>Button URL<input value={selectedSlot.href} maxLength={250} onChange={e=>update({href:e.target.value})}/></label>
   </>}
   {inspectorTab==="design"&&<>
    <p className="cse-muted">These design settings change only this CMS section, not the native catalog, cart or checkout.</p>
    {([["background","Background"],["textColor","Text color"],["accentColor","Button / Accent"]] as const).map(([field,label])=><label key={field}>{label}<div className="cse-color-control"><input type="color" value={selectedSlot.style[field]} onChange={e=>updateStyle({[field]:e.target.value})}/><input maxLength={7} value={selectedSlot.style[field]} onChange={e=>updateStyle({[field]:e.target.value})}/></div></label>)}
    <label>Heading size ({selectedSlot.style.fontSize}px)<input type="range" min={18} max={64} value={selectedSlot.style.fontSize} onChange={e=>updateStyle({fontSize:Number(e.target.value)})}/></label>
    <label>Section spacing ({selectedSlot.style.padding}px)<input type="range" min={0} max={100} value={selectedSlot.style.padding} onChange={e=>updateStyle({padding:Number(e.target.value)})}/></label>
    <label>Corner radius ({selectedSlot.style.radius}px)<input type="range" min={0} max={48} value={selectedSlot.style.radius} onChange={e=>updateStyle({radius:Number(e.target.value)})}/></label>
    <label>Text alignment<select value={selectedSlot.style.alignment} onChange={e=>updateStyle({alignment:e.target.value as CmsSlot["style"]["alignment"]})}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
    <label>Image layout<select value={selectedSlot.style.imagePosition} onChange={e=>updateStyle({imagePosition:e.target.value as CmsSlot["style"]["imagePosition"]})}><option value="right">Image on right</option><option value="left">Image on left</option><option value="background">Image background</option></select></label>
   </>}
   {inspectorTab==="publish"&&<>
    <label>Placement<select value={selectedSlot.placement} onChange={e=>update({placement:e.target.value as CmsSlot["placement"]})}><option value="before">Before existing page</option><option value="after">After existing page</option></select></label>
    <label className="cse-checkbox"><input type="checkbox" checked={selectedSlot.enabled} onChange={e=>update({enabled:e.target.checked})}/>{selectedSlot.enabled?<Eye size={15}/>:<EyeOff size={15}/>} Enabled on publish</label>
    <button type="button" onClick={()=>copySlot(selectedSlot.id)} disabled={slots.length>=20}>Duplicate this block</button>
    <button type="button" className="cse-delete" onClick={()=>{if(window.confirm("Remove this CMS section from the draft?")){setSlots(x=>x.filter(v=>v.id!==selectedSlot.id));setSelected(null);}}}><Trash2 size={15}/> Remove block</button>
   </>}
   </>:<p className="cse-muted">Select a block from the left panel or preview.</p>}
  </section></div>
  <div className="cse-actions"><button type="button" onClick={exportJson}>Export JSON</button><button type="button" onClick={()=>jsonInput.current?.click()}>Import JSON</button><input ref={jsonInput} type="file" accept="application/json,.json" hidden onChange={e=>{const file=e.currentTarget.files?.[0];if(file)void importJson(file);e.currentTarget.value="";}}/><button type="button" onClick={()=>void save("saveDraft")} disabled={busy}><Save size={16}/> Save Draft</button><button type="button" className="cse-publish" onClick={()=>void save("publish")} disabled={busy}><Upload size={16}/> Publish Page Slots</button><button type="button" onClick={()=>void load()} disabled={busy}><RefreshCw size={15}/> Discard / Reload</button><span>{dirty?"Unsaved editor changes":"Draft saved"} · {record.publishedAt?"Published "+new Date(record.publishedAt).toLocaleString("en-BD"):"Never published"}</span></div>
  {notice&&<p className="cse-notice" role="status">{notice}</p>}
 </div>;
}
