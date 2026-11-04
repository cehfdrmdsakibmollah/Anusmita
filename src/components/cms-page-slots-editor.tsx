"use client";
import {useCallback,useEffect,useState} from "react";
import {Plus,Save,Upload,Trash2,ArrowUp,ArrowDown,Eye,EyeOff,RefreshCw} from "lucide-react";
import {cmsSlotSchema,type CmsSlot,type CmsSlotPage} from "@/lib/cms-page-slots";
import "./cms-page-slots-editor.css";
type Payload={page:CmsSlotPage;revision:number;publishedRevision:number;draft:CmsSlot[];published:CmsSlot[];publishedAt:string|null};
const fresh=(position:number):CmsSlot=>({id:crypto.randomUUID(),placement:"before",title:"New ANUSMITA Collection",subtitle:"Discover what is new and thoughtfully curated.",badge:"ANUSMITA EDIT",imageUrl:"",cta:"Explore Collection",href:"/shop",enabled:true,position});
export default function CmsPageSlotsEditor({page,onPublished}:{page:CmsSlotPage;onPublished?:()=>void}){
 const [record,setRecord]=useState<Payload|null>(null),[slots,setSlots]=useState<CmsSlot[]>([]),[selected,setSelected]=useState<string|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[mode,setMode]=useState<"draft"|"published">("draft");
 const load=useCallback(async()=>{const r=await fetch("/api/admin/cms-page-slots?page="+encodeURIComponent(page),{cache:"no-store"});const j=await r.json();if(!r.ok)throw Error(j.error||"Could not fetch CMS slots");setRecord(j);setSlots(j.draft);setSelected(null);setNotice("");},[page]);
 useEffect(()=>{void load().catch(e=>setNotice("Error: "+String(e)));},[load]);
 const selectedSlot=slots.find(s=>s.id===selected);
 function update(changes:Partial<CmsSlot>){if(!selectedSlot)return;setSlots(old=>old.map(s=>s.id===selected?{...s,...changes}:s));}
 const dirty=!!record&&JSON.stringify(slots)!==JSON.stringify(record.draft);
 function add(){const item=fresh(slots.length);setSlots(prev=>[...prev,item]);setSelected(item.id);setMode("draft");}
 function move(id:string,dir:number){const arr=[...slots];const i=arr.findIndex(x=>x.id===id),j=i+dir;if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];setSlots(arr.map((s,index)=>({...s,position:index})));}
 async function save(action:"saveDraft"|"publish"){if(!record||busy)return;const valid=cmsSlotSchema.array().max(20).safeParse(slots);if(!valid.success){setNotice("Validation: "+valid.error.issues.map(i=>i.message).join("; "));return;}
  if(action==="publish"&&!window.confirm("Publish "+slots.length+" editorial block(s) to /"+page+"? Existing native storefront interactions will remain untouched."))return;
  setBusy(true);setNotice("");
  try{const r=await fetch("/api/admin/cms-page-slots",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({page,revision:record.revision,action,slots:valid.data})});const j=await r.json();if(!r.ok)throw Error(j.error||"Save failed");setRecord(j);setSlots(j.draft);setNotice(action==="publish"?"Published revision "+j.publishedRevision+". Reload page preview to view your changes.":"Draft revision "+j.revision+" saved. Public page unchanged.");if(action==="publish")onPublished?.();
  }catch(e){setNotice("Error: "+String(e));}finally{setBusy(false);}
 }
 if(!record)return <div className="cse-empty" role="status">{notice||"Loading "+page+" CMS slots…"}</div>;
 return <div className="cse-root"><div className="cse-heading"><div><h3>Editable {page} page slots</h3><p>Add banners, text and curated CTA sections without altering the existing storefront logic.</p></div><span>Draft r{record.revision} · Live r{record.publishedRevision}</span></div>
  <div className="cse-workspace"><section className="cse-list"><div className="cse-section-head"><strong>Page sections ({slots.length})</strong><button onClick={add} disabled={slots.length>=20}><Plus size={14}/> Add</button></div>
   {slots.length===0&&<p className="cse-muted">No custom sections yet. The original page remains visible.</p>}
   {slots.map((s,i)=><div key={s.id} className={"cse-row"+(selected===s.id?" active":"")}><button onClick={()=>setSelected(s.id)}><span>{i+1}.</span><span>{s.title}</span></button><small>{s.placement}</small><button title="Move up" disabled={i===0} onClick={()=>move(s.id,-1)}><ArrowUp size={13}/></button><button title="Move down" disabled={i===slots.length-1} onClick={()=>move(s.id,1)}><ArrowDown size={13}/></button></div>)}
   <p className="cse-muted">Before and After indicate placement around the original page. Existing native page elements are protected.</p>
  </section>
  <section className="cse-canvas"><div className="cse-preview-head"><strong>CMS block preview</strong><span>Unsaved draft</span></div>
   {slots.map(s=><button key={s.id} className={"cse-preview-card"+(selected===s.id?" active":"")} onClick={()=>setSelected(s.id)}>
    <div><small>{s.badge||"ANUSMITA"}</small><h3>{s.title}</h3><p>{s.subtitle}</p><em>{s.cta||"Shop now"} →</em></div>{s.imageUrl&&<img src={s.imageUrl} alt=""/>}
    <span className="cse-flag">{s.enabled?"Visible":"Hidden"} · {s.placement}</span></button>)}
   {!slots.length&&<p className="cse-empty-preview">Use Add to start editing this page.</p>}
  </section>
  <section className="cse-inspector"><h3>Section Settings</h3>
   {selectedSlot?<><label>Title<input value={selectedSlot.title} maxLength={110} onChange={e=>update({title:e.target.value})}/></label>
    <label>Subtitle<textarea rows={3} maxLength={400} value={selectedSlot.subtitle} onChange={e=>update({subtitle:e.target.value})}/></label>
    <label>Eyebrow / Badge<input maxLength={60} value={selectedSlot.badge} onChange={e=>update({badge:e.target.value})}/></label>
    <label>Image URL<input placeholder="/brand/categories/skincare.webp" value={selectedSlot.imageUrl} onChange={e=>update({imageUrl:e.target.value})}/></label>
    <p className="cse-muted">Approved brand image or Cloudinary/Unsplash HTTPS URL. Upload assets using existing media management.</p>
    <label>Button text<input maxLength={48} value={selectedSlot.cta} onChange={e=>update({cta:e.target.value})}/></label>
    <label>Destination<input value={selectedSlot.href} onChange={e=>update({href:e.target.value})}/></label>
    <label>Page placement<select value={selectedSlot.placement} onChange={e=>update({placement:e.target.value as CmsSlot["placement"]})}><option value="before">Before native page</option><option value="after">After native page</option></select></label>
    <label className="cse-checkbox"><input type="checkbox" checked={selectedSlot.enabled} onChange={e=>update({enabled:e.target.checked})}/>{selectedSlot.enabled?<Eye size={15}/>:<EyeOff size={15}/>} Enabled</label>
    <button className="cse-delete" onClick={()=>{if(window.confirm("Delete this editor block from the draft?")){setSlots(x=>x.filter(v=>v.id!==selectedSlot.id));setSelected(null);}}}><Trash2 size={15}/> Remove block</button>
   </>:<p className="cse-muted">Select a block from the left panel or preview.</p>}
  </section></div>
  <div className="cse-actions"><button type="button" onClick={()=>void save("saveDraft")} disabled={busy}><Save size={16}/> Save Draft</button><button type="button" className="cse-publish" onClick={()=>void save("publish")} disabled={busy}><Upload size={16}/> Publish Page Slots</button><button type="button" onClick={()=>void load()} disabled={busy}><RefreshCw size={15}/> Discard / Reload</button><span>{dirty?"Unsaved editor changes":"Draft saved"} · {record.publishedAt?"Published "+new Date(record.publishedAt).toLocaleString("en-BD"):"Never published"}</span></div>
  {notice&&<p className="cse-notice" role="status">{notice}</p>}
 </div>;
}
