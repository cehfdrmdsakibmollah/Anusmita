"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {Plus,Save,Upload,Trash2,ArrowUp,ArrowDown,Eye,EyeOff,RefreshCw} from "lucide-react";
import {cmsSlotSchema,defaultCmsStyle,cmsSectionKinds,cmsNativeHeroSchema,defaultCmsNativeHero,type CmsNativeHero,type CmsSlot,type CmsSlotPage} from "@/lib/cms-page-slots";
import CmsMediaLibrary from "@/components/cms-media-library";
import "./cms-page-slots-editor.css";
type Payload={page:CmsSlotPage;revision:number;publishedRevision:number;draft:CmsSlot[];published:CmsSlot[];publishedAt:string|null;nativeDraft:CmsNativeHero;nativePublished:CmsNativeHero;history:{revision:number;action:"saveDraft"|"publish"|"restoreDraft";createdAt:string;slotCount:number}[]};
const fresh=(position:number,kind:CmsSlot["kind"]="banner"):CmsSlot=>({id:crypto.randomUUID(),placement:"before",kind,style:{...defaultCmsStyle},title:"New ANUSMITA Collection",subtitle:"Discover what is new and thoughtfully curated.",badge:"ANUSMITA EDIT",imageUrl:"",children:[],cta:"Explore Collection",href:"/shop",enabled:true,position});
export default function CmsPageSlotsEditor({page,onPublished}:{page:CmsSlotPage;onPublished?:()=>void}){
 const jsonInput=useRef<HTMLInputElement|null>(null);
 const mediaInput=useRef<HTMLInputElement|null>(null);
 const nativeMediaInput=useRef<HTMLInputElement|null>(null);
 const sectionMediaInput=useRef<HTMLInputElement|null>(null);
 const [native,setNative]=useState<CmsNativeHero>(defaultCmsNativeHero);
 const [restoreRevision,setRestoreRevision]=useState("");
 const [mediaBusy,setMediaBusy]=useState(false);
 const [createKind,setCreateKind]=useState<CmsSlot["kind"]>("banner");
 const [canvasView,setCanvasView]=useState<"live"|"blocks">("live");
 const [canvasDevice,setCanvasDevice]=useState<"desktop"|"tablet"|"mobile">("desktop");
 const canvasWidth=canvasDevice==="desktop"?1280:canvasDevice==="tablet"?768:390;
 const [previewKey,setPreviewKey]=useState(0);
 const [draggingId,setDraggingId]=useState<string|null>(null);
 const touchDrag=useRef<{pointerId:number;sourceId:string}|null>(null);
 const publicPath=["about","contact","journal"].includes(page)?"/"+page+"/design-preview":"/"+page;
 const [inspectorTab,setInspectorTab]=useState<"content"|"design"|"publish">("content");
 const [record,setRecord]=useState<Payload|null>(null),[slots,setSlots]=useState<CmsSlot[]>([]),[selected,setSelected]=useState<string|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[mode,setMode]=useState<"draft"|"published">("draft");
 const load=useCallback(async()=>{const r=await fetch("/api/admin/cms-page-slots?page="+encodeURIComponent(page),{cache:"no-store"});const j=await r.json();if(!r.ok)throw Error(j.error||"Could not fetch CMS slots");const parsed=cmsSlotSchema.array().max(20).parse(j.draft);const nativeParsed=cmsNativeHeroSchema.parse(j.nativeDraft||{});setRecord({...j,history:j.history||[],draft:parsed,nativeDraft:nativeParsed,nativePublished:cmsNativeHeroSchema.parse(j.nativePublished||{})});setRestoreRevision("");setNative(nativeParsed);setSlots(parsed);setSelected(null);setNotice("");},[page]);
 useEffect(()=>{void load().catch(e=>setNotice("Error: "+String(e)));},[load]);
 const selectedSlot=slots.find(s=>s.id===selected);
 function exportJson(){
  const blob=new Blob([JSON.stringify({format:"anusmita-cms-slots",version:1,page,slots},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=page+"-cms-sections.json";a.click();URL.revokeObjectURL(url);
 }
 async function uploadImage(file:File,target:"block"|"native"|"nativeSection"|"nested"="block",nestedId?:string){
  if(target!=="native"&&target!=="nativeSection"&&!selectedSlot){setNotice("Select a section first.");return;}
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size<=0||file.size>3*1024*1024){setNotice("Choose a JPEG, PNG or WebP image under 3 MB.");return;}
  const targetId=selectedSlot?.id;
  setMediaBusy(true);setNotice("Uploading CMS image…");
  try{
   const form=new FormData();form.set("page",page);form.set("file",file);
   const r=await fetch("/api/admin/cms-page-slots/media",{method:"POST",body:form});
   const data=await r.json();if(!r.ok)throw Error(data.error||"Upload failed");
   if(target==="native")setNative(v=>({...v,imageUrl:data.url}));
   else if(target==="nativeSection")setNative(v=>({...v,sectionImageUrl:data.url}));
   else if(target==="nested")setSlots(old=>old.map(x=>x.id===targetId?{...x,children:x.children.map(card=>card.id===nestedId?{...card,imageUrl:data.url}:card)}:x));
   else setSlots(old=>old.map(x=>x.id===targetId?{...x,imageUrl:data.url}:x));
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
 function modifyNested(id:string,changes:Partial<CmsSlot["children"][number]>){if(!selectedSlot)return;update({children:selectedSlot.children.map(card=>card.id===id?{...card,...changes}:card)});}
 function addNested(){if(!selectedSlot||selectedSlot.children.length>=6)return;update({children:[...selectedSlot.children,{id:crypto.randomUUID(),title:"New editorial card",subtitle:"",imageUrl:"",cta:"Explore",href:"/shop"}]});}
 function moveNested(id:string,direction:number){if(!selectedSlot)return;const items=[...selectedSlot.children],index=items.findIndex(card=>card.id===id),next=index+direction;if(index<0||next<0||next>=items.length)return;[items[index],items[next]]=[items[next],items[index]];update({children:items});}
 const dirty=!!record&&(JSON.stringify(slots)!==JSON.stringify(record.draft)||JSON.stringify(native)!==JSON.stringify(record.nativeDraft));
 useEffect(()=>{if(!dirty)return;const guard=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue="";};window.addEventListener("beforeunload",guard);return()=>window.removeEventListener("beforeunload",guard);},[dirty]);
 function add(){const item=fresh(slots.length,createKind);setSlots(prev=>[...prev,item]);setSelected(item.id);setMode("draft");}
 function copySlot(id:string){const item=slots.find(x=>x.id===id);if(!item||slots.length>=20)return;const next={...item,id:crypto.randomUUID(),position:slots.length};setSlots(old=>[...old,next]);setSelected(next.id);}
 function updateStyle(changes:Partial<CmsSlot["style"]>){if(!selectedSlot)return;update({style:{...selectedSlot.style,...changes}});}
 function move(id:string,dir:number){const arr=[...slots];const i=arr.findIndex(x=>x.id===id),j=i+dir;if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];setSlots(arr.map((s,index)=>({...s,position:index})));}
 function dropSection(targetId:string,sourceId:string|null=draggingId){
  setDraggingId(null);
  if(!sourceId||sourceId===targetId||busy||mediaBusy)return;
  const sourceIndex=slots.findIndex(s=>s.id===sourceId),targetIndex=slots.findIndex(s=>s.id===targetId);
  if(sourceIndex<0||targetIndex<0)return;
  const reordered=[...slots];const [moved]=reordered.splice(sourceIndex,1);reordered.splice(targetIndex,0,moved);
  setSlots(reordered.map((s,index)=>({...s,position:index})));
  setNotice("Section order updated in your unsaved draft. Save Draft, then Publish to update the public page.");
 }
 function startTouchSection(event:React.PointerEvent<HTMLButtonElement>,id:string){
  if(event.pointerType==="mouse"||busy||mediaBusy)return;
  event.preventDefault();
  touchDrag.current={pointerId:event.pointerId,sourceId:id};
  setDraggingId(id);
  event.currentTarget.setPointerCapture(event.pointerId);
 }
 function endTouchSection(event:React.PointerEvent<HTMLButtonElement>){
  const state=touchDrag.current;
  if(!state||state.pointerId!==event.pointerId)return;
  touchDrag.current=null;
  const found=document.elementFromPoint(event.clientX,event.clientY)?.closest("[data-cms-section-id]");
  const targetId=found?.getAttribute("data-cms-section-id")||null;
  if(targetId)dropSection(targetId,state.sourceId);
  else setDraggingId(null);
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
 }
 function cancelTouchSection(){
  touchDrag.current=null;setDraggingId(null);
 }
 async function restoreDraft(){
  if(!record||busy||mediaBusy||!restoreRevision)return;
  const rev=Number(restoreRevision);
  if(!Number.isInteger(rev)||!record.history.some(h=>h.revision===rev)){setNotice("Select a retained revision.");return;}
  if(!window.confirm("Restore revision "+rev+" as a NEW DRAFT for "+page+"? Current unsaved edits will be discarded. The live published page will not change."))return;
  setBusy(true);setNotice("");
  try{
   const response=await fetch("/api/admin/cms-page-slots",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({page,revision:record.revision,action:"restoreDraft",restoreRevision:rev})});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"Revision restore failed");
   const parsed=cmsSlotSchema.array().max(20).parse(data.draft);
   const hero=cmsNativeHeroSchema.parse(data.nativeDraft||{});
   setRecord({...data,history:data.history||[],draft:parsed,nativeDraft:hero,nativePublished:cmsNativeHeroSchema.parse(data.nativePublished||{})});
   setSlots(parsed);setNative(hero);setSelected(null);setRestoreRevision("");
   setNotice("Revision "+rev+" restored as draft r"+data.revision+". The live page is unchanged. Review and Publish Page Slots only when ready.");
  }catch(e){setNotice("Restore error: "+String(e));}
  finally{setBusy(false);}
 }
 async function save(action:"saveDraft"|"publish"){if(!record||busy)return;const valid=cmsSlotSchema.array().max(20).safeParse(slots);const nativeValid=cmsNativeHeroSchema.safeParse(native);if(!nativeValid.success){setNotice("Hero validation: "+nativeValid.error.issues.map(i=>i.message).join("; "));return;}if(!valid.success){setNotice("Validation: "+valid.error.issues.map(i=>i.message).join("; "));return;}
  if(action==="publish"&&!window.confirm("Publish "+slots.length+" editorial block(s) to /"+page+"? Existing native storefront interactions will remain untouched."))return;
  setBusy(true);setNotice("");
  try{const r=await fetch("/api/admin/cms-page-slots",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({page,revision:record.revision,action,slots:valid.data,nativeHero:nativeValid.data})});const j=await r.json();if(!r.ok)throw Error(j.error||"Save failed");const nextNative=cmsNativeHeroSchema.parse(j.nativeDraft||{});setRecord({...j,nativeDraft:nextNative,nativePublished:cmsNativeHeroSchema.parse(j.nativePublished||{})});setNative(nextNative);setSlots(cmsSlotSchema.array().max(20).parse(j.draft));setNotice(action==="publish"?"Published revision "+j.publishedRevision+". Reload page preview to view your changes.":"Draft revision "+j.revision+" saved. Public page unchanged.");if(action==="publish"){setPreviewKey(v=>v+1);onPublished?.();}
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
   <CmsMediaLibrary scope={page} onChoose={url=>setNative(hero=>({...hero,imageUrl:url}))}/>
    <div className="cse-native-image-preview" aria-live="polite">
    <strong>{native.imageUrl?"Unsaved hero image preview":"Current native image preserved"}</strong>
    {native.imageUrl?<img src={native.imageUrl} alt="Draft hero image preview" onError={()=>setNotice("Image preview failed. Verify the approved URL before publishing.")}/>:<p className="cse-muted">No CMS image override. This page retains its original hero artwork.</p>}
    <div className="cse-media-upload"><button type="button" disabled={mediaBusy||!native.imageUrl} onClick={()=>setNative(n=>({...n,imageUrl:""}))}>Restore original hero image</button><button type="button" disabled={mediaBusy} onClick={()=>nativeMediaInput.current?.click()}>Replace image</button></div>
   </div>
   <div className="cse-native-section-fields">
    <h4>Native page section headings</h4>
    <p className="cse-muted">Edit the real storefront headings, not just banners placed above/below the page. Blank values preserve the original design text. Prices, product data, forms and interactive behavior are unchanged.</p>
    <label>{page==="deals"?"Flash Deals heading":page==="bundles"?"Routine section heading":page==="about"?"Story section heading":page==="contact"?"Contact form heading":"Featured guide heading"}<input maxLength={130} value={native.sectionTitle} placeholder="Keep existing native heading" onChange={e=>setNative(n=>({...n,sectionTitle:e.target.value}))}/></label>
    {page!=="deals"&&page!=="contact"&&<label>{page==="bundles"?"Bundle collection heading":page==="about"?"Care section heading":"Skin type section heading"}<input maxLength={130} value={native.secondaryTitle} placeholder="Keep existing native heading" onChange={e=>setNative(n=>({...n,secondaryTitle:e.target.value}))}/></label>}
    <button type="button" onClick={()=>setNative(n=>({...n,sectionTitle:"",secondaryTitle:""}))} disabled={!native.sectionTitle&&!native.secondaryTitle}>Restore original section headings</button>
   </div>
   {page!=="contact"&&<div className="cse-native-section-media">
    <h4>Native section image — {page}</h4>
    <p className="cse-muted">Replace decorative editorial artwork without modifying prices, filters, cards or forms.</p>
    <label>Approved image URL<input maxLength={500} value={native.sectionImageUrl} onChange={e=>setNative(n=>({...n,sectionImageUrl:e.target.value}))} placeholder="Keep original image"/></label>
    <CmsMediaLibrary scope={page} onChoose={url=>setNative(n=>({...n,sectionImageUrl:url}))}/>
    <input type="file" hidden ref={sectionMediaInput} accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.currentTarget.files?.[0];if(file)void uploadImage(file,"nativeSection");e.currentTarget.value="";}}/>
    <div className="cse-media-upload"><button type="button" disabled={mediaBusy} onClick={()=>sectionMediaInput.current?.click()}>Upload replacement to R2</button><button type="button" disabled={!native.sectionImageUrl||mediaBusy} onClick={()=>setNative(n=>({...n,sectionImageUrl:""}))}>Restore original image</button></div>
    {native.sectionImageUrl&&<img src={native.sectionImageUrl} className="cse-native-section-thumbnail" alt="Draft replacement artwork"/>}
   </div>}
   <p className="cse-muted">Image upload adds a new R2 asset to the draft; it does not publish automatically. Click Save Draft then Publish Page Slots to update the public hero.</p>
  </div>}
  <div className="cse-workspace"><section className="cse-list"><div className="cse-section-head"><strong>Page sections ({slots.length})</strong><div className="cse-add-control"><select aria-label="Section type to add" value={createKind} onChange={e=>setCreateKind(e.target.value as CmsSlot["kind"])}>{cmsSectionKinds.map(t=><option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>)}</select><button onClick={add} disabled={slots.length>=20}><Plus size={14}/> Add</button></div></div>
   {slots.length===0&&<p className="cse-muted">No custom sections yet. The original page remains visible.</p>}
   {slots.map((s,i)=><div key={s.id} className={"cse-row"+(selected===s.id?" active":"")+(draggingId===s.id?" cse-row-dragging":"")} data-cms-section-id={s.id} draggable={!busy&&!mediaBusy} onDragStart={e=>{if(busy||mediaBusy){e.preventDefault();return;}setDraggingId(s.id);e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",s.id);}} onDragOver={e=>{if(draggingId){e.preventDefault();e.dataTransfer.dropEffect="move";}}} onDrop={e=>{e.preventDefault();dropSection(s.id);}} onDragEnd={()=>setDraggingId(null)}><button type="button" className="cse-touch-handle" title="Touch and drag to reorder" aria-label={"Touch and drag section "+(i+1)} onPointerDown={e=>startTouchSection(e,s.id)} onPointerUp={endTouchSection} onPointerCancel={cancelTouchSection}>⠿</button><button onClick={()=>setSelected(s.id)}><span>{i+1}.</span><span>{s.title}</span></button><small>{s.kind}</small><button title="Duplicate section" disabled={slots.length>=20} onClick={()=>copySlot(s.id)}>⧉</button><button title="Move up" disabled={i===0} onClick={()=>move(s.id,-1)}><ArrowUp size={13}/></button><button title="Move down" disabled={i===slots.length-1} onClick={()=>move(s.id,1)}><ArrowDown size={13}/></button></div>)}
   <p className="cse-muted">Drag a section row to reorder (desktop), or use the Up/Down buttons. Save Draft and Publish to apply. Before/After placement still preserves native page elements.</p>
  </section>
  <section className="cse-canvas">
   <div className="cse-preview-head"><strong>{canvasView==="live"?"Actual storefront preview":"CMS block draft preview"}</strong><div className="cse-canvas-controls"><button type="button" aria-pressed={canvasView==="live"} onClick={()=>setCanvasView("live")}>Live page</button><button type="button" aria-pressed={canvasView==="blocks"} onClick={()=>setCanvasView("blocks")}>Draft blocks</button><button type="button" onClick={()=>setPreviewKey(v=>v+1)}>Reload</button></div></div>
   <div className="cse-device-controls" role="group" aria-label="Storefront preview viewport">
    {(["desktop","tablet","mobile"] as const).map(device=><button key={device} type="button" aria-pressed={canvasDevice===device} onClick={()=>setCanvasDevice(device)}>{device[0].toUpperCase()+device.slice(1)}</button>)}
    <span>{canvasWidth}px viewport · scroll inside canvas to inspect wider pages</span>
   </div>
   {canvasView==="live"&&<><p className="cse-muted">Published storefront route. To change the native hero, edit its fields above; draft CMS blocks are shown under Draft blocks. Saving a draft alone does not change the public page.</p><div className="cse-preview-viewport" role="region" aria-label={canvasDevice+" page preview"} tabIndex={0}><iframe key={publicPath+previewKey} className="cse-live-frame" style={{width:canvasWidth}} title={page+" published storefront"} src={publicPath} loading="lazy"/></div></>}
   <div className="cse-preview-viewport" role="region" aria-label={canvasDevice+" draft block preview"} tabIndex={0} hidden={canvasView!=="blocks"}><div className="cse-blocks-canvas" style={{width:canvasWidth}}>
   {slots.map(s=><button key={s.id} className={"cse-preview-card cse-preview-"+s.kind+(selected===s.id?" active":"")} style={{background:s.style.background,color:s.style.textColor,borderRadius:s.style.radius}} onClick={()=>setSelected(s.id)}>
    <div style={{padding:s.style.padding,textAlign:s.style.alignment}}><small>{s.badge||"ANUSMITA"}</small><h3 style={{fontSize:s.style.fontSize,color:s.style.textColor}}>{s.title}</h3><p>{s.subtitle}</p>{s.cta&&<em style={{background:s.style.accentColor,borderRadius:Math.min(s.style.radius,24)}}>{s.cta} →</em>}</div>{s.imageUrl&&<img src={s.imageUrl} alt=""/>}
    {s.kind==="grid"&&<div className="cse-nested-preview">{s.children.map(card=><span key={card.id}>{card.imageUrl&&<img src={card.imageUrl} alt=""/>}<strong>{card.title}</strong><small>{card.subtitle}</small></span>)}</div>}
    <span className="cse-flag">{s.enabled?"Visible":"Hidden"} · {s.placement}</span></button>)}
   {!slots.length&&<p className="cse-empty-preview">Use Add to start editing this page.</p>}
   </div></div>
  </section>
  <section className="cse-inspector"><h3>Section Settings</h3>
   <div className="cse-inspector-tabs" role="group" aria-label="Inspector panels">{(["content","design","publish"] as const).map(t=><button type="button" key={t} className={inspectorTab===t?"active":""} onClick={()=>setInspectorTab(t)}>{t}</button>)}</div>
   {selectedSlot?<>{inspectorTab==="content"&&<>
    <label>Block type<select value={selectedSlot.kind} onChange={e=>update({kind:e.target.value as CmsSlot["kind"],children:e.target.value==="grid"?selectedSlot.children:[]})}>{cmsSectionKinds.map(t=><option key={t} value={t}>{t}</option>)}</select></label>
    <label>Title<input value={selectedSlot.title} maxLength={110} onChange={e=>update({title:e.target.value})}/></label>
    <label>Subtitle<textarea rows={4} maxLength={400} value={selectedSlot.subtitle} onChange={e=>update({subtitle:e.target.value})}/></label>
    <label>Badge<input value={selectedSlot.badge} maxLength={60} onChange={e=>update({badge:e.target.value})}/></label>
    <CmsMediaLibrary scope={page} onChoose={url=>update({imageUrl:url})}/>
     <label>Image URL<input value={selectedSlot.imageUrl} maxLength={500} placeholder="/brand/categories/skincare.webp" onChange={e=>update({imageUrl:e.target.value})}/></label>
    <div className="cse-media-upload"><input type="file" hidden ref={mediaInput} accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.currentTarget.files?.[0];if(file)void uploadImage(file);e.currentTarget.value="";}}/><button type="button" disabled={mediaBusy} onClick={()=>mediaInput.current?.click()}>{mediaBusy?"Uploading…":"Upload CMS image to R2"}</button></div><p className="cse-muted">JPEG/PNG/WebP, maximum 3 MB. Upload creates a new CMS asset and does not touch product photos. Save Draft and Publish to use it.</p>
    {selectedSlot.kind==="grid"&&<div className="cse-nested-editor">
     <div className="cse-nested-heading"><strong>Nested editorial cards ({selectedSlot.children.length}/6)</strong><button type="button" disabled={selectedSlot.children.length>=6||busy||mediaBusy} onClick={addNested}><Plus size={13}/> Add card</button></div>
     <p className="cse-muted">Create nested image/text/CTA cards inside this editorial grid. These are CMS-only content; no product pricing, cart or inventory is altered.</p>
     {selectedSlot.children.map((card,index)=><div className="cse-nested-item" key={card.id}>
      <div className="cse-nested-actions"><b>Card {index+1}</b><button type="button" aria-label={"Move nested card "+(index+1)+" up"} disabled={index===0} onClick={()=>moveNested(card.id,-1)}><ArrowUp size={13}/></button><button type="button" aria-label={"Move nested card "+(index+1)+" down"} disabled={index===selectedSlot.children.length-1} onClick={()=>moveNested(card.id,1)}><ArrowDown size={13}/></button><button type="button" aria-label={"Remove nested card "+(index+1)} onClick={()=>{if(window.confirm("Remove this nested editorial card from the draft?"))update({children:selectedSlot.children.filter(c=>c.id!==card.id)});}}><Trash2 size={13}/></button></div>
      <label>Card heading<input value={card.title} maxLength={100} onChange={e=>modifyNested(card.id,{title:e.target.value})}/></label>
      <label>Card description<textarea rows={2} value={card.subtitle} maxLength={240} onChange={e=>modifyNested(card.id,{subtitle:e.target.value})}/></label>
      <label>Card image URL<input value={card.imageUrl} maxLength={500} onChange={e=>modifyNested(card.id,{imageUrl:e.target.value})}/></label>
      {card.imageUrl&&<img src={card.imageUrl} className="cse-nested-thumb" alt={"Draft card "+(index+1)+" media"}/>}
      <CmsMediaLibrary scope={page} onChoose={url=>modifyNested(card.id,{imageUrl:url})}/>
      <div className="cse-nested-media"><label>Upload image<input type="file" accept="image/jpeg,image/png,image/webp" disabled={mediaBusy} onChange={e=>{const file=e.currentTarget.files?.[0];if(file)void uploadImage(file,"nested",card.id);e.currentTarget.value="";}}/></label><button type="button" disabled={mediaBusy||!card.imageUrl} onClick={()=>modifyNested(card.id,{imageUrl:""})}>Clear image</button></div>
      <label>Button label<input value={card.cta} maxLength={40} onChange={e=>modifyNested(card.id,{cta:e.target.value})}/></label>
      <label>Button destination<input value={card.href} maxLength={250} onChange={e=>modifyNested(card.id,{href:e.target.value})}/></label>
     </div>)}
    </div>}
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
  <div className="cse-actions"><button type="button" onClick={exportJson}>Export JSON</button><button type="button" onClick={()=>jsonInput.current?.click()}>Import JSON</button><input ref={jsonInput} type="file" accept="application/json,.json" hidden onChange={e=>{const file=e.currentTarget.files?.[0];if(file)void importJson(file);e.currentTarget.value="";}}/><button type="button" onClick={()=>void save("saveDraft")} disabled={busy||mediaBusy}><Save size={16}/> Save Draft</button><button type="button" className="cse-publish" onClick={()=>void save("publish")} disabled={busy||mediaBusy}><Upload size={16}/> Publish Page Slots</button><button type="button" onClick={()=>void load()} disabled={busy}><RefreshCw size={15}/> Discard / Reload</button><span>{dirty?"Unsaved editor changes":"Draft saved"} · {record.publishedAt?"Published "+new Date(record.publishedAt).toLocaleString("en-BD"):"Never published"}</span></div>
  <div className="cse-revision-tools"><label>Revision history (latest 20 saved revisions)
   <select value={restoreRevision} onChange={e=>setRestoreRevision(e.target.value)}><option value="">Select saved revision…</option>{(record.history||[]).map(h=><option key={h.revision} value={h.revision}>r{h.revision} · {h.action} · {new Date(h.createdAt).toLocaleString("en-BD")}</option>)}</select></label>
   <button type="button" disabled={busy||mediaBusy||!restoreRevision} onClick={()=>void restoreDraft()}>Restore selected as draft</button>
   <p>Restoring creates a new draft revision. It never immediately replaces published page content or deletes R2 assets. History begins when this feature is deployed; older changes cannot be reconstructed.</p>
  </div>
  {dirty&&<p className="cse-notice" role="status">Unsaved draft changes are not visible on the live page. Save Draft, then Publish Page Slots to publish text and images.</p>}
  {notice&&<p className="cse-notice" role="status">{notice}</p>}
 </div>;
}
