"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {Plus,Save,Upload,Trash2,ArrowUp,ArrowDown,Eye,EyeOff,RefreshCw} from "lucide-react";
import {cmsSlotSchema,defaultCmsStyle,cmsSectionKinds,cmsNativeHeroSchema,defaultCmsNativeHero,type CmsNativeHero,type CmsSlot,type CmsSlotPage} from "@/lib/cms-page-slots";
import CmsMediaLibrary from "@/components/cms-media-library";
import CmsCssControls from "@/components/cms-css-controls";
import CmsLiveVisualCanvas from "@/components/cms-live-visual-canvas";
import {cloneCmsSlotWithFreshIds,remapImportedCmsSlots} from "@/lib/cms-slot-clone";
import {nativeTextTargets,validatePageNativeText,type CmsNativeKey} from "@/lib/cms-native-bindings";
import {nativePromoIds,nativePromoLabels,validateNativePromoIds} from "@/lib/cms-promo-bindings";
import type {CmsCssRule} from "@/lib/cms-css-rules";
import {renderCmsCssRules,validateNativeCmsCssScopes} from "@/lib/cms-css-rules";
import {hasNativePageHero,hasCmsPageIntro,sameCmsPageDraft} from "@/lib/cms-page-editor-support";
import "./cms-page-slots-editor.css";
type Payload={page:CmsSlotPage;revision:number;publishedRevision:number;draft:CmsSlot[];published:CmsSlot[];publishedAt:string|null;nativeDraft:CmsNativeHero;nativePublished:CmsNativeHero;history:{revision:number;action:"saveDraft"|"publish"|"restoreDraft";createdAt:string;slotCount:number}[]};
const fresh=(position:number,kind:CmsSlot["kind"]="banner"):CmsSlot=>({id:crypto.randomUUID(),placement:"before",kind,style:{...defaultCmsStyle},cssRules:[],title:"New ANUSMITA Collection",subtitle:"Discover what is new and thoughtfully curated.",badge:"ANUSMITA EDIT",imageUrl:"",children:[],cta:"Explore Collection",href:"/shop",enabled:true,position});
export default function CmsPageSlotsEditor({page,onPublished,onDirtyChange}:{page:CmsSlotPage;onPublished?:()=>void;onDirtyChange?:(dirty:boolean)=>void}){
 const jsonInput=useRef<HTMLInputElement|null>(null);
 const mediaInput=useRef<HTMLInputElement|null>(null);
 const nativeMediaInput=useRef<HTMLInputElement|null>(null);
 const sectionMediaInput=useRef<HTMLInputElement|null>(null);
 const [native,setNative]=useState<CmsNativeHero>(defaultCmsNativeHero);
 const [restoreRevision,setRestoreRevision]=useState("");
 const [mediaBusy,setMediaBusy]=useState(false);
 const [createKind,setCreateKind]=useState<CmsSlot["kind"]>("banner");
 const [navigatorTab,setNavigatorTab]=useState<"sections"|"blocks"|"layouts">("sections");
 const [canvasView,setCanvasView]=useState<"live"|"blocks">("live");
 const [pickedTarget,setPickedTarget]=useState<CmsCssRule["target"]>("hero");
 const [canvasDevice,setCanvasDevice]=useState<"desktop"|"tablet"|"mobile">("desktop");
 const [selectedNative,setSelectedNative]=useState(true);
 const [selectedPromoId,setSelectedPromoId]=useState<string|null>(null);
 const [selectedNativeField,setSelectedNativeField]=useState<string|null>(null);
 const canvasWidth=canvasDevice==="desktop"?1280:canvasDevice==="tablet"?768:390;
 const [previewKey,setPreviewKey]=useState(0);
 const [draggingId,setDraggingId]=useState<string|null>(null);
 const touchDrag=useRef<{pointerId:number;sourceId:string}|null>(null);
 const publicPath=["about","contact","journal"].includes(page)?"/"+page+"/design-preview":"/"+page;
 const [inspectorTab,setInspectorTab]=useState<"content"|"design"|"publish">("content");
 const [record,setRecord]=useState<Payload|null>(null),[slots,setSlots]=useState<CmsSlot[]>([]),[selected,setSelected]=useState<string|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[mode,setMode]=useState<"draft"|"published">("draft");
 const load=useCallback(async()=>{const r=await fetch("/api/admin/cms-page-slots?page="+encodeURIComponent(page),{cache:"no-store"});const j=await r.json();if(!r.ok)throw Error(j.error||"Could not fetch CMS slots");const parsed=cmsSlotSchema.array().max(20).parse(j.draft);const nativeParsed=cmsNativeHeroSchema.parse(j.nativeDraft||{});setRecord({...j,history:j.history||[],draft:parsed,nativeDraft:nativeParsed,nativePublished:cmsNativeHeroSchema.parse(j.nativePublished||{})});setRestoreRevision("");setNative(nativeParsed);setSlots(parsed);setSelected(null);setSelectedPromoId(null);setSelectedNativeField(null);setSelectedNative(true);setCanvasView("live");setNotice("");},[page]);
 useEffect(()=>{void load().catch(e=>setNotice("Error: "+String(e)));},[load]);
 const selectedSlot=slots.find(s=>s.id===selected);
 function chooseCmsSection(id:string){setSelected(id);setSelectedNative(false);setCanvasView("blocks");setInspectorTab("content");}
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
   setSlots(remapImportedCmsSlots(validated));setSelected(null);setNotice("Imported "+validated.length+" safe CMS sections as an unsaved draft. Review and Save Draft before publishing.");
  }catch(e){setNotice("Import rejected: "+(e instanceof Error?e.message:String(e)));}
 }

 function patchPromo(id:string,changes:Partial<CmsNativeHero["promoCards"][number]>){setNative(old=>{const existing=old.promoCards.find(c=>c.id===id)||{id,title:"",imageUrl:"",enabled:true};return {...old,promoCards:[...old.promoCards.filter(c=>c.id!==id),{...existing,...changes}]};});}
 function setNativeText(key:CmsNativeKey,text:string){setNative(old=>({...old,textBindings:text?([...old.textBindings.filter(item=>item.key!==key),{key,text,enabled:true}]):old.textBindings.filter(item=>item.key!==key)}));}
 function update(changes:Partial<CmsSlot>){if(!selectedSlot)return;setSlots(old=>old.map(s=>s.id===selected?{...s,...changes}:s));}
 function modifyNested(id:string,changes:Partial<CmsSlot["children"][number]>){if(!selectedSlot)return;update({children:selectedSlot.children.map(card=>card.id===id?{...card,...changes}:card)});}
 function addSubcard(parentId:string){if(!selectedSlot)return;const children=selectedSlot.children.map(card=>card.id===parentId&&card.subcards.length<4?{...card,subcards:[...card.subcards,{id:crypto.randomUUID(),title:"New nested item",subtitle:"",imageUrl:"",cta:"",href:"/shop"}]}:card);update({children});}
 function patchSubcard(parentId:string,leafId:string,changes:Partial<CmsSlot["children"][number]["subcards"][number]>){if(!selectedSlot)return;update({children:selectedSlot.children.map(card=>card.id===parentId?{...card,subcards:card.subcards.map(x=>x.id===leafId?{...x,...changes}:x)}:card)});}
 function deleteSubcard(parentId:string,leafId:string){if(!selectedSlot)return;update({children:selectedSlot.children.map(card=>card.id===parentId?{...card,subcards:card.subcards.filter(x=>x.id!==leafId)}:card)});}
 function addNested(){if(!selectedSlot||selectedSlot.children.length>=6)return;update({children:[...selectedSlot.children,{id:crypto.randomUUID(),title:"New editorial card",subtitle:"",imageUrl:"",cta:"Explore",href:"/shop",subcards:[]}]});}
 function moveNested(id:string,direction:number){if(!selectedSlot)return;const items=[...selectedSlot.children],index=items.findIndex(card=>card.id===id),next=index+direction;if(index<0||next<0||next>=items.length)return;[items[index],items[next]]=[items[next],items[index]];update({children:items});}
 const dirty=!!record&&(JSON.stringify(slots)!==JSON.stringify(record.draft)||JSON.stringify(native)!==JSON.stringify(record.nativeDraft));
 useEffect(()=>{onDirtyChange?.(dirty);return()=>onDirtyChange?.(false);},[dirty,onDirtyChange]);
 useEffect(()=>{if(!dirty)return;const guard=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue="";};window.addEventListener("beforeunload",guard);return()=>window.removeEventListener("beforeunload",guard);},[dirty]);
 function add(){addFromLibrary(createKind);}
 function addFromLibrary(kind:CmsSlot["kind"],preset:"default"|"two-column"|"three-cards"="default"){
  if(busy||mediaBusy||slots.length>=20)return;
  const item=fresh(slots.length,kind);
  if(preset!=="default"){
   item.title=preset==="two-column"?"Featured editorial split":"Featured collections";
   item.kind=preset==="two-column"?"split":"grid";
   if(item.kind==="grid")item.children=Array.from({length:3},(_,index)=>({id:crypto.randomUUID(),title:"Collection "+(index+1),subtitle:"Edit this collection in the Content inspector.",imageUrl:"",cta:"Explore",href:"/shop",subcards:[]}));
   if(item.kind==="split")item.style={...item.style,imagePosition:"left"};
  }
  setSlots(prev=>[...prev,item]);setSelected(item.id);setSelectedNative(false);setCanvasView("blocks");setInspectorTab("content");setNavigatorTab("sections");setMode("draft");
  setNotice("Added an editable "+item.kind+" section to the local draft. Save Draft and Publish Page to make it visible.");
 }
 function copySlot(id:string){const item=slots.find(x=>x.id===id);if(!item||slots.length>=20)return;const next=cloneCmsSlotWithFreshIds(item,slots.length);setSlots(old=>[...old,next]);setSelected(next.id);setSelectedNative(false);setCanvasView("blocks");}
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
 async function save(action:"saveDraft"|"publish"){if(!record||busy)return;const valid=cmsSlotSchema.array().max(20).safeParse(slots);const nativeValid=cmsNativeHeroSchema.safeParse(native);if(nativeValid.success&&!validateNativeCmsCssScopes(page,nativeValid.data.cssRules)){setNotice("Unsupported selected element CSS scope for this page.");return;}if(nativeValid.success&&!validateNativePromoIds(page,nativeValid.data.promoCards)){setNotice("Unsupported native promotional card for this page.");return;}if(nativeValid.success&&!validatePageNativeText(page,nativeValid.data.textBindings)){setNotice("Unsupported native text binding for this page.");return;}if(!nativeValid.success){setNotice("Hero validation: "+nativeValid.error.issues.map(i=>i.message).join("; "));return;}if(!valid.success){setNotice("Validation: "+valid.error.issues.map(i=>i.message).join("; "));return;}
  if(action==="publish"&&!window.confirm("Publish "+slots.length+" editorial block(s) to /"+page+"? Existing native storefront interactions will remain untouched."))return;
  setBusy(true);setNotice("");
  try{
   const response=await fetch("/api/admin/cms-page-slots",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({page,revision:record.revision,action,slots:valid.data,nativeHero:nativeValid.data})});
   const data=await response.json();if(!response.ok)throw Error(data.error||"Save failed");
   const savedRevision=Number(data.revision);
   const verification=await fetch("/api/admin/cms-page-slots?page="+encodeURIComponent(page),{cache:"no-store"});
   const persisted=await verification.json();if(!verification.ok)throw Error(persisted.error||"Could not verify saved CMS data");
   const savedSlots=cmsSlotSchema.array().max(20).parse(persisted.draft);
   const savedHero=cmsNativeHeroSchema.parse(persisted.nativeDraft||{});
   if(!sameCmsPageDraft({draft:valid.data,nativeDraft:nativeValid.data,revision:savedRevision},{draft:savedSlots,nativeDraft:savedHero,revision:Number(persisted.revision)}))throw Error("Saved page revision/content differs; reload before editing.");
   if(action==="publish"&&Number(persisted.publishedRevision)!==savedRevision)throw Error("Published revision did not persist; reload before editing.");
   setRecord({...persisted,draft:savedSlots,nativeDraft:savedHero,nativePublished:cmsNativeHeroSchema.parse(persisted.nativePublished||{}),history:persisted.history||[]});
   setNative(savedHero);setSlots(savedSlots);
   setNotice(action==="publish"?"Published and database-verified revision "+savedRevision+". Refresh the public preview to inspect changes.":"Draft saved and database-verified revision "+savedRevision+". Public page unchanged.");
   if(action==="publish"){setPreviewKey(v=>v+1);onPublished?.();}
  }catch(e){setNotice("Error: "+String(e));}finally{setBusy(false);}
 }
 if(!record)return <div className="cse-empty" role="status">{notice||"Loading "+page+" CMS slots…"}</div>;
 return <div className="cse-root"><div className="cse-heading"><div><h3>{page} · Visual Page Editor</h3><p>Click real page elements to edit supported content and styles. Native business data remains protected.</p><span>Draft r{record.revision} · Published r{record.publishedRevision}</span></div><div className="cse-top-actions"><a className="cse-editor-nav-link" href="#global-store-chrome-editor" onClick={()=>setNotice("Global menu and footer links use the secured Header & Footer Builder above. Open Edit Header & Footer to change or reorder links.")}>Header / Footer Menu Editor</a><button type="button" onClick={()=>void save("saveDraft")} disabled={busy||mediaBusy}>Save Draft</button><button type="button" className="cse-top-publish" onClick={()=>void save("publish")} disabled={busy||mediaBusy}>Publish Page</button></div></div>
  <div className="cse-workspace"><section className="cse-list"><div className="cse-workspace-tabs" role="group" aria-label="Page builder workspace">{(["sections","blocks","layouts"] as const).map(tab=><button type="button" key={tab} className={navigatorTab===tab?"active":""} aria-pressed={navigatorTab===tab} onClick={()=>setNavigatorTab(tab)}>{tab[0].toUpperCase()+tab.slice(1)}</button>)}</div>{navigatorTab==="sections"?<><div className="cse-section-head"><strong>CMS Sections ({slots.length})</strong><div className="cse-add-control"><select aria-label="Section type to add" value={createKind} onChange={e=>setCreateKind(e.target.value as CmsSlot["kind"])}>{cmsSectionKinds.map(t=><option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>)}</select><button onClick={add} disabled={slots.length>=20}><Plus size={14}/> Add</button></div></div>
   <button type="button" className={"cse-native-row"+(selectedNative?" active":"")} onClick={()=>{setSelectedNative(true);setSelected(null);setCanvasView("live");setInspectorTab("content");setPickedTarget("hero");}}><span>01 · {hasNativePageHero(page)?"Native Hero & Page Content":"Page Intro & Branding"}</span><small>Edit text · image · colors</small></button>
 <div className="cse-native-element-list" aria-label="Native page selectable element types">
 {(["hero","heading","card","button","image"] as const).map(target=><button type="button" key={target} className={selectedNative&&pickedTarget===target?"active":""} onClick={()=>{setSelectedNative(true);setSelected(null);setCanvasView("live");setPickedTarget(target);setInspectorTab(target==="hero"||target==="heading"||target==="image"?"content":"design");}}>{target[0].toUpperCase()+target.slice(1)} <span>{target==="card"?"style":"edit"}</span></button>)}
 </div>
 <div className="cse-protected-row"><strong>Original page remains functional</strong><small>Click its visible elements in the live canvas. Product content, payments and order data stay managed in their original modules.</small></div>
 {slots.length===0&&<p className="cse-muted">No custom sections yet. Open Blocks or Layouts to add the first editable section.</p>}
   {slots.map((s,i)=><div key={s.id} className={"cse-row"+(selected===s.id?" active":"")+(draggingId===s.id?" cse-row-dragging":"")} data-cms-section-id={s.id} draggable={!busy&&!mediaBusy} onDragStart={e=>{if(busy||mediaBusy){e.preventDefault();return;}setDraggingId(s.id);e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",s.id);}} onDragOver={e=>{if(draggingId){e.preventDefault();e.dataTransfer.dropEffect="move";}}} onDrop={e=>{e.preventDefault();dropSection(s.id);}} onDragEnd={()=>setDraggingId(null)}><button type="button" className="cse-touch-handle" title="Touch and drag to reorder" aria-label={"Touch and drag section "+(i+1)} onPointerDown={e=>startTouchSection(e,s.id)} onPointerUp={endTouchSection} onPointerCancel={cancelTouchSection}>⠿</button><button onClick={()=>chooseCmsSection(s.id)}><span>{i+1}.</span><span>{s.title}</span></button><small>{s.kind}</small><button title="Duplicate section" disabled={slots.length>=20} onClick={()=>copySlot(s.id)}>⧉</button><button type="button" aria-label={"Delete draft section "+(i+1)} title="Remove section from draft" disabled={busy||mediaBusy} onClick={()=>{if(window.confirm("Remove this editable CMS section from the draft? Existing storefront content is unaffected until Publish.")){setSlots(old=>old.filter(slot=>slot.id!==s.id).map((slot,index)=>({...slot,position:index})));if(selected===s.id){setSelected(null);setSelectedNative(true);}setNotice("Section removed from unsaved draft. Save and Publish to apply.");}}}><Trash2 size={13}/></button><button title="Move up" disabled={i===0} onClick={()=>move(s.id,-1)}><ArrowUp size={13}/></button><button title="Move down" disabled={i===slots.length-1} onClick={()=>move(s.id,1)}><ArrowDown size={13}/></button></div>)}
   <p className="cse-muted">Drag to reorder or use arrows. To edit, select a section and choose Content, Style or Advanced. Native commerce remains protected.</p></>:navigatorTab==="blocks"?<div className="cse-library-panel"><h3>Block Library</h3><p>Add independently editable content to this page. Existing page elements stay intact.</p><div className="cse-library-tiles">{cmsSectionKinds.map(kind=><button type="button" key={kind} disabled={slots.length>=20||busy||mediaBusy} onClick={()=>addFromLibrary(kind)}><span>{kind==="hero"?"▣":kind==="grid"?"▦":kind==="image"?"▧":kind==="split"?"◫":"▤"}</span>{kind[0].toUpperCase()+kind.slice(1)}</button>)}</div></div>:<div className="cse-library-panel"><h3>Layout Library</h3><p>Choose a ready-to-edit layout. It creates an ordinary CMS draft section, not a replacement for your working storefront.</p><div className="cse-library-tiles"><button type="button" disabled={slots.length>=20||busy||mediaBusy} onClick={()=>addFromLibrary("split","two-column")}>◫ Two-column editorial</button><button type="button" disabled={slots.length>=20||busy||mediaBusy} onClick={()=>addFromLibrary("grid","three-cards")}>▦ Three-card collection</button><button type="button" disabled={slots.length>=20||busy||mediaBusy} onClick={()=>addFromLibrary("hero")}>▣ Full-width hero</button><button type="button" disabled={slots.length>=20||busy||mediaBusy} onClick={()=>addFromLibrary("banner")}>▤ Promotional banner</button></div></div>}
  </section>
  <section className="cse-canvas">
   <div className="cse-preview-head"><strong>{canvasView==="live"?"Live storefront canvas":"Editable section canvas"}</strong><div className="cse-canvas-controls"><button type="button" aria-pressed={canvasView==="live"} onClick={()=>setCanvasView("live")}>Edit real page</button><button type="button" aria-pressed={canvasView==="blocks"} onClick={()=>setCanvasView("blocks")}>CMS sections</button><button type="button" onClick={()=>setPreviewKey(v=>v+1)}>Reload</button></div></div>
   <div className="cse-device-controls" role="group" aria-label="Storefront preview viewport">
    {(["desktop","tablet","mobile"] as const).map(device=><button key={device} type="button" aria-pressed={canvasDevice===device} onClick={()=>setCanvasDevice(device)}>{device[0].toUpperCase()+device.slice(1)}</button>)}
    <span>{canvasWidth}px maximum · visual editor fits available width; live frame can scroll</span>
   </div>
   {canvasView==="live"&&<CmsLiveVisualCanvas page={page} src={publicPath} width={canvasWidth} revision={previewKey} draft={native} onPick={(target,id)=>{setPickedTarget(target);if(id?.startsWith("promo:")){setSelectedPromoId(id.slice(6));setSelectedNativeField(null);setSelectedNative(true);setSelected(null);setInspectorTab(target==="card"||target==="button"?"design":"content");return;}if(id&&slots.some(slot=>slot.id===id)){chooseCmsSection(id);return;}setSelectedPromoId(null);setSelectedNativeField(id?.startsWith("text:")||id?.startsWith("field:")?id:null);setSelectedNative(true);setSelected(null);setInspectorTab(id?.startsWith("text:")||id?.startsWith("field:")?"content":target==="hero"?"content":"design");}}/>}
   <div className="cse-preview-viewport" role="region" aria-label={canvasDevice+" draft block preview"} tabIndex={0} hidden={canvasView!=="blocks"}><div className="cse-blocks-canvas" style={{width:"100%",maxWidth:canvasWidth}}>
   <div className="cse-native-block-link"><strong>Real native {page} page</strong><p>The existing page is shown in the real storefront canvas. Use this tab to edit additional CMS sections.</p><button type="button" onClick={()=>{setSelectedNative(true);setCanvasView("live");}}>Select on actual page</button></div>
   {slots.map(s=><div key={s.id} data-cms-draft-slot={s.id}>
   <style>{renderCmsCssRules(s.cssRules,`[data-cms-draft-slot="${s.id}"]`,{hero:".cse-preview-card",heading:".cse-preview-card h3",card:".cse-nested-preview span",button:".cse-preview-card em",image:".cse-preview-card img"})}</style>
   <button type="button" className={"cse-preview-card cse-preview-"+s.kind+(selected===s.id?" active":"")} style={{background:s.style.background,color:s.style.textColor,borderRadius:s.style.radius}} onClick={()=>chooseCmsSection(s.id)}>
    <div style={{padding:s.style.padding,textAlign:s.style.alignment}}><small>{s.badge||"ANUSMITA"}</small><h3 style={{fontSize:s.style.fontSize,color:s.style.textColor}}>{s.title}</h3><p>{s.subtitle}</p>{s.cta&&<em style={{background:s.style.accentColor,borderRadius:Math.min(s.style.radius,24)}}>{s.cta} →</em>}</div>{s.imageUrl&&<img src={s.imageUrl} alt=""/>}
    {s.kind==="grid"&&<div className="cse-nested-preview">{s.children.map(card=><span key={card.id}>{card.imageUrl&&<img src={card.imageUrl} alt=""/>}<strong>{card.title}</strong><small>{card.subtitle}</small>{card.subcards.length>0&&<span className="cse-subcard-preview">{card.subcards.map(leaf=><span key={leaf.id}>{leaf.imageUrl&&<img src={leaf.imageUrl} alt=""/>}<strong>{leaf.title}</strong></span>)}</span>}</span>)}</div>}
    <span className="cse-flag">{s.enabled?"Visible":"Hidden"} · {s.placement}</span></button></div>)}
   {!slots.length&&<p className="cse-empty-preview">Use Add to create a banner, image, text or card-grid section.</p>}
   </div></div>
  </section>
  <section className="cse-inspector"><h3>{selectedNative?"Page Content & Style":"Section Settings"}</h3>
   <div className="cse-inspector-tabs" role="group" aria-label="Inspector panels">{(["content","design","publish"] as const).map(t=><button type="button" key={t} className={inspectorTab===t?"active":""} onClick={()=>setInspectorTab(t)}>{t==="design"?"Style":t==="publish"?"Advanced":"Content"}</button>)}</div>
   {selectedNative&&<div className="cse-picked-context" role="status"><strong>{selectedPromoId?"Selected promotional card: "+(nativePromoLabels[selectedPromoId]||selectedPromoId):selectedNativeField?"Selected text/image: "+selectedNativeField.replace(/^(text:|field:)/,""):pickedTarget+" selected"}</strong><span>Edits are local until Save Draft and Publish Page. Operational prices, product data and checkout are protected.</span><div className="cse-picked-actions"><button type="button" onClick={()=>setInspectorTab("content")}>Edit content / image</button><button type="button" onClick={()=>setInspectorTab("design")}>Edit CSS / hover</button>{(selectedPromoId||selectedNativeField)&&<button type="button" onClick={()=>{setSelectedPromoId(null);setSelectedNativeField(null);}}>Clear selection</button>}</div></div>}
   {selectedNative&&inspectorTab==="content"&&selectedNativeField&&(()=>{
    const field=selectedNativeField.replace(/^field:/,"");
    const key=selectedNativeField.replace(/^text:/,"") as CmsNativeKey;
    if(selectedNativeField.startsWith("text:")){
     const binding=native.textBindings.find(item=>item.key===key);
     return <div className="cse-quick-editor"><h4>Edit selected {key.replace(/([A-Z])/g," $1")}</h4><input aria-label="Selected native text" maxLength={240} placeholder="Keep original text" value={binding?.text||""} onChange={e=>setNativeText(key,e.target.value)}/><button type="button" onClick={()=>setNativeText(key,"")}>Restore original text</button></div>;
    }
    if(field==="title"||field==="subtitle"||field==="sectionTitle")return <div className="cse-quick-editor"><h4>Edit selected {field}</h4><textarea aria-label="Selected native content" rows={field==="subtitle"?3:2} maxLength={field==="subtitle"?320:130} value={native[field]} onChange={e=>setNative(old=>({...old,[field]:e.target.value}))}/><button type="button" onClick={()=>setNative(old=>({...old,[field]:""}))}>Restore original</button></div>;
    if(field==="imageUrl"||field==="sectionImageUrl")return <div className="cse-quick-editor"><h4>Replace selected {field==="imageUrl"?"hero":"section"} image</h4><input aria-label="Selected native image URL" value={native[field]} maxLength={500} placeholder="Original image preserved" onChange={e=>setNative(old=>({...old,[field]:e.target.value}))}/><CmsMediaLibrary scope={page} onChoose={url=>setNative(old=>({...old,[field]:url}))}/><button type="button" onClick={()=>setNative(old=>({...old,[field]:""}))}>Restore original image</button></div>;
    return null;
   })()}
   {selectedNative&&inspectorTab==="content"&&selectedPromoId&&(()=>{
    const id=selectedPromoId;const item=native.promoCards.find(p=>p.id===id);
    return <div className="cse-quick-editor"><h4>Edit selected card · {nativePromoLabels[id]||id}</h4><label>Card title<input aria-label="Selected card title" maxLength={100} value={item?.title||""} placeholder={nativePromoLabels[id]||"Original title"} onChange={e=>patchPromo(id,{title:e.target.value})}/></label><label>Card image URL<input aria-label="Selected card image URL" maxLength={500} value={item?.imageUrl||""} placeholder="Original artwork preserved" onChange={e=>patchPromo(id,{imageUrl:e.target.value})}/></label><CmsMediaLibrary scope={page} onChoose={url=>patchPromo(id,{imageUrl:url})}/><label className="cse-checkbox"><input type="checkbox" checked={item?.enabled!==false} onChange={e=>patchPromo(id,{enabled:e.target.checked})}/>Card visible</label><div className="cse-picked-actions"><button type="button" onClick={()=>setNative(old=>({...old,promoCards:old.promoCards.filter(p=>p.id!==id)}))}>Restore original card</button><button type="button" onClick={()=>setInspectorTab("design")}>Edit this card CSS</button></div></div>;
   })()}
   {selectedNative?<>{inspectorTab==="content"&&(hasNativePageHero(page)||hasCmsPageIntro(page))&&<div className="cse-native-hero">
   <div><h4>{hasNativePageHero(page)?"Native Page Hero":"Page Intro Builder"} — {page}</h4><p className="cse-muted">{hasNativePageHero(page)?"Override existing hero title, subtitle, image and colors.":"Add an optional editable title, subtitle and image above existing native content. Blank fields remove the intro."} Cart, product, checkout and order logic remain unchanged.</p></div>
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
    <strong>{native.imageUrl?"Draft page image preview":hasNativePageHero(page)?"Current native image preserved":"No intro image selected"}</strong>
    {native.imageUrl?<img src={native.imageUrl} alt="Draft page image preview" onError={()=>setNotice("Image preview failed. Verify the approved URL before publishing.")}/>:<p className="cse-muted">No CMS image override. Existing page content remains unchanged.</p>}
    <div className="cse-media-upload"><button type="button" disabled={mediaBusy||!native.imageUrl} onClick={()=>setNative(n=>({...n,imageUrl:""}))}>Restore original hero image</button><button type="button" disabled={mediaBusy} onClick={()=>nativeMediaInput.current?.click()}>Replace image</button></div>
   </div>
   {hasNativePageHero(page)&&<div className="cse-native-section-fields">
    <h4>Native page section headings</h4>
    <p className="cse-muted">Edit the real storefront headings, not just banners placed above/below the page. Blank values preserve the original design text. Prices, product data, forms and interactive behavior are unchanged.</p>
    <label>{page==="shop"?"Shop products heading":page==="gift-cards"?"Gift card settings heading":page==="pre-orders"?"Shipment journey heading":page==="customer-stories"?"Community gallery heading":page==="routine-quiz"?"Guidance section heading":page==="track-order"?"Order tracking form heading":page==="cart"?"Shopping bag heading":page==="checkout"?"Checkout heading":page==="wishlist"?"Empty wishlist heading":page==="deals"?"Flash Deals heading":page==="bundles"?"Routine section heading":page==="about"?"Story section heading":page==="contact"?"Contact form heading":"Featured guide heading"}<input maxLength={130} value={native.sectionTitle} placeholder="Keep existing native heading" onChange={e=>setNative(n=>({...n,sectionTitle:e.target.value}))}/></label>
    {(["bundles","about","journal"] as string[]).includes(page)&&<label>{page==="bundles"?"Bundle collection heading":page==="about"?"Care section heading":"Skin type section heading"}<input maxLength={130} value={native.secondaryTitle} placeholder="Keep existing native heading" onChange={e=>setNative(n=>({...n,secondaryTitle:e.target.value}))}/></label>}
    <button type="button" onClick={()=>setNative(n=>({...n,sectionTitle:"",secondaryTitle:""}))} disabled={!native.sectionTitle&&!native.secondaryTitle}>Restore original section headings</button>
   </div>}
   {(["deals","bundles","about","journal"] as string[]).includes(page)&&<div className="cse-native-section-media">
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
  {inspectorTab==="content"&&<div className="cse-native-text-binding-editor">
   <h4>Native Cards, Forms & Editorial Text</h4>
   <p className="cse-muted">Edit approved text inside existing native page elements. These fields change only display copy—not form submissions, real prices, inventory, order data or checkout actions.</p>
   {Object.entries(nativeTextTargets[page]).map(([key,selector])=>{
    const binding=native.textBindings.find(item=>item.key===key);
    return <label key={key}>{key.replace(/([A-Z])/g," $1")} <small>{selector}</small>
     <input maxLength={240} value={binding?.text||""} placeholder="Keep original text" onChange={e=>setNativeText(key as CmsNativeKey,e.target.value)}/>
     {binding&&<button type="button" onClick={()=>setNativeText(key as CmsNativeKey,"")}>Restore original {key}</button>}
    </label>;
   })}
  </div>}
  {inspectorTab==="content"&&(page==="deals"||page==="bundles")&&<div className="cse-native-promo-editor"><h4>Native Promotional Cards · {page}</h4><p className="cse-muted">Edit existing presentation cards. Names/images/visibility only; sample prices and product data cannot be changed here. Use CMS grid to create additional editorial promotions.</p>
   {nativePromoIds[page].map(id=>{const item=native.promoCards.find(p=>p.id===id);return <div className={"cse-native-promo-item"+(selectedPromoId===id?" active":"")} key={id}><button type="button" onClick={()=>setSelectedPromoId(selectedPromoId===id?null:id)}>{nativePromoLabels[id]} {selectedPromoId===id?"▴":"▾"}</button>
    {selectedPromoId===id&&false&&<div className="cse-native-promo-fields"><label>Display title<input maxLength={100} value={item?.title||""} placeholder={"Keep "+nativePromoLabels[id]} onChange={e=>patchPromo(id,{title:e.target.value})}/></label><label>Approved image URL<input maxLength={500} value={item?.imageUrl||""} placeholder="Keep original artwork" onChange={e=>patchPromo(id,{imageUrl:e.target.value})}/></label><CmsMediaLibrary scope={page} onChoose={url=>patchPromo(id,{imageUrl:url})}/><label className="cse-checkbox"><input type="checkbox" checked={item?.enabled!==false} onChange={e=>patchPromo(id,{enabled:e.target.checked})}/>Visible</label><button type="button" onClick={()=>setNative(old=>({...old,promoCards:old.promoCards.filter(p=>p.id!==id)}))}>Restore original card</button></div>}
   </div>;})}
  </div>}
  {inspectorTab==="design"&&<CmsCssControls rules={native.cssRules} preferredTarget={pickedTarget} preferredElementId={selectedPromoId} scopeOptions={(page==="deals"||page==="bundles")?nativePromoIds[page].map(id=>({id,label:nativePromoLabels[id]})):[]} disabled={busy||mediaBusy} onChange={cssRules=>setNative(value=>({...value,cssRules}))}/>}
  {inspectorTab==="publish"&&<p className="cse-muted">Publish the configured page styles and editorial content without altering protected commerce logic.</p>}
  </>:selectedSlot?<>{inspectorTab==="content"&&<>
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
      <div className="cse-subcard-editor"><div className="cse-nested-heading"><strong>Nested layout items ({card.subcards.length}/4)</strong><button type="button" disabled={busy||mediaBusy||card.subcards.length>=4} onClick={()=>addSubcard(card.id)}>+ Nested item</button></div>
       {card.subcards.map(leaf=><div key={leaf.id} className="cse-subcard-entry"><label>Nested item heading<input value={leaf.title} maxLength={100} onChange={e=>patchSubcard(card.id,leaf.id,{title:e.target.value})}/></label><label>Details<textarea value={leaf.subtitle} maxLength={240} onChange={e=>patchSubcard(card.id,leaf.id,{subtitle:e.target.value})}/></label><label>Approved image URL<input value={leaf.imageUrl} maxLength={500} onChange={e=>patchSubcard(card.id,leaf.id,{imageUrl:e.target.value})}/></label><CmsMediaLibrary scope={page} onChoose={url=>patchSubcard(card.id,leaf.id,{imageUrl:url})}/><label>CTA text<input value={leaf.cta} maxLength={40} onChange={e=>patchSubcard(card.id,leaf.id,{cta:e.target.value})}/></label><label>CTA link<input value={leaf.href} maxLength={250} onChange={e=>patchSubcard(card.id,leaf.id,{href:e.target.value})}/></label><button type="button" onClick={()=>deleteSubcard(card.id,leaf.id)}>Remove nested item</button></div>)}
      </div>
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
     <CmsCssControls rules={selectedSlot.cssRules} disabled={busy||mediaBusy} onChange={cssRules=>update({cssRules})}/>
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
