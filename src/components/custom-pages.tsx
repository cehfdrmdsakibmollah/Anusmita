"use client";
import {useEffect,useState} from "react";
type Block={id:string;type:"heading"|"paragraph"|"callout";text:string};
type Page={slug:string;title:string;description:string;published:boolean;revision:number;blocks:Block[]};
const blank=():Page=>({slug:"",title:"",description:"",published:false,revision:0,blocks:[{id:crypto.randomUUID(),type:"heading",text:"Page heading"}]});
export default function CustomPages(){
 const [pages,setPages]=useState<Page[]>([]),[page,setPage]=useState<Page|null>(null),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 async function load(){try{const r=await fetch("/api/admin/content-pages",{cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to load pages");setPages(d.pages||[]);}catch(e){setNotice(String(e));}}
 useEffect(()=>{void load();},[]);
 function editBlock(id:string,patch:Partial<Block>){if(page)setPage({...page,blocks:page.blocks.map(b=>b.id===id?{...b,...patch}:b)});}
 function move(index:number,dir:number){if(!page||index+dir<0||index+dir>=page.blocks.length)return;const blocks=[...page.blocks];[blocks[index],blocks[index+dir]]=[blocks[index+dir],blocks[index]];setPage({...page,blocks});}
 async function save(e:React.FormEvent){e.preventDefault();if(!page)return;setBusy(true);setNotice("");try{const r=await fetch("/api/admin/content-pages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(page)});const d=await r.json();if(!r.ok)throw Error(d.error||"Save failed");setPage({...page,revision:d.revision});setNotice("Page saved and audited. Public URL: /pages/"+page.slug);await load();}catch(e){setNotice(String(e));}finally{setBusy(false);}}
 return <section className="adminCard"><h2>Custom Pages & Policy Builder</h2><p className="smallprint">Add text-only heading, paragraph and callout blocks. Reorder, preview, save draft or publish at /pages/slug. No JavaScript injection or replacement of existing privacy/returns pages.</p>
 <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}><button className="button small" type="button" onClick={()=>setPage(blank())}>New page</button><label>Choose existing <select value={pages.find(p=>p.slug===page?.slug)?.slug||""} onChange={e=>setPage(pages.find(p=>p.slug===e.target.value)||null)}><option value="">Select page</option>{pages.map(p=><option value={p.slug} key={p.slug}>{p.title}</option>)}</select></label></div>
 {notice&&<p role="status">{notice}</p>}
 {page&&<form className="adminForm" onSubmit={e=>void save(e)}>
 <div className="field"><label>Page slug (immutable after first save)<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} disabled={page.revision>0} value={page.slug} onChange={e=>setPage({...page,slug:e.target.value})}/></label></div>
 <div className="field"><label>Page title<input minLength={3} maxLength={100} required value={page.title} onChange={e=>setPage({...page,title:e.target.value})}/></label></div>
 <div className="field"><label>SEO description<textarea maxLength={160} value={page.description} onChange={e=>setPage({...page,description:e.target.value})}/></label></div>
 <h3>Content blocks</h3>{page.blocks.map((b,i)=><div key={b.id} className="kpi" style={{padding:12}}>
 <label>Block type <select value={b.type} onChange={e=>editBlock(b.id,{type:e.target.value as Block["type"]})}><option value="heading">Heading</option><option value="paragraph">Paragraph</option><option value="callout">Callout</option></select></label>
 <div className="field"><label>Content<textarea rows={b.type==="paragraph"?5:2} required maxLength={3000} value={b.text} onChange={e=>editBlock(b.id,{text:e.target.value})}/></label></div>
 <button type="button" className="button small light" disabled={i===0} onClick={()=>move(i,-1)}>↑</button> <button type="button" className="button small light" disabled={i===page.blocks.length-1} onClick={()=>move(i,1)}>↓</button> <button type="button" className="button small light" disabled={page.blocks.length===1} onClick={()=>setPage({...page,blocks:page.blocks.filter(x=>x.id!==b.id)})}>Remove</button></div>)}
 <button type="button" className="button small light" disabled={page.blocks.length>=30} onClick={()=>setPage({...page,blocks:[...page.blocks,{id:crypto.randomUUID(),type:"paragraph",text:"New paragraph"}]})}>Add content block</button>
 <h3>Draft preview</h3><div className="adminCard">{page.blocks.map(b=><div key={b.id} style={{margin:"12px 0",padding:b.type==="callout"?14:0,border:b.type==="callout"?"1px solid #ecdadd":undefined,whiteSpace:"pre-wrap"}}>{b.type==="heading"?<h3>{b.text}</h3>:<p>{b.text}</p>}</div>)}</div>
 <label><input type="checkbox" checked={page.published} onChange={e=>setPage({...page,published:e.target.checked})}/> Publish public page</label>
 <button type="submit" className="button" disabled={busy}>Save page</button></form>}
 </section>;
}
