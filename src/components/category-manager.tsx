"use client";
import {useEffect,useState} from "react";
type Category={id:string;name:string;slug:string;parentId:string|null;active:boolean;position:number;description:string;seoTitle:string;seoDescription:string};
const empty={name:"",slug:"",parentId:null as string|null,active:true,position:0,description:"",seoTitle:"",seoDescription:""};
export default function CategoryManager(){
 const [rows,setRows]=useState<Category[]>([]),[editing,setEditing]=useState<string|null>(null),[form,setForm]=useState(empty),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 async function refresh(){try{const r=await fetch("/api/admin/categories",{cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error||"Request failed");setRows(d.categories||[]);}catch(e){setMessage(String(e));}}
 useEffect(()=>{void refresh();},[]);
 function edit(c:Category){setEditing(c.id);setForm({name:c.name,slug:c.slug,parentId:c.parentId,active:c.active,position:c.position,description:c.description,seoTitle:c.seoTitle,seoDescription:c.seoDescription});}
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage("");try{const r=await fetch("/api/admin/categories",{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(editing?{...form,id:editing}:form)});const d=await r.json();if(!r.ok)throw Error(d.error||"Save failed");setEditing(null);setForm(empty);setMessage("Category saved and audit recorded");await refresh();}catch(e){setMessage(String(e));}finally{setBusy(false);}}
 async function remove(c:Category){if(!window.confirm("Delete category "+c.name+"? It must have no products or children."))return;setBusy(true);try{const r=await fetch("/api/admin/categories",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:c.id})});const d=await r.json();if(!r.ok)throw Error(d.error||"Delete refused");setMessage("Category deleted");await refresh();}catch(e){setMessage(String(e));}finally{setBusy(false);}}
 return <section className="adminCard"><h2>Category & Subcategory Manager</h2><p className="smallprint">Independent taxonomy registry. Existing catalog category strings and storefront URLs will not be changed automatically.</p>{message&&<p role="status">{message}</p>}
 <form onSubmit={e=>void submit(e)} className="adminForm"><h3>{editing?"Edit category":"Create category"}</h3>
 <div className="field"><label>Name<input required maxLength={90} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label></div>
 <div className="field"><label>Slug<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/></label></div>
 <div className="field"><label>Parent<select value={form.parentId||""} onChange={e=>setForm({...form,parentId:e.target.value||null})}><option value="">Top-level category</option>{rows.filter(c=>c.id!==editing).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
 <div className="field"><label>Order<input type="number" min={0} max={99999} value={form.position} onChange={e=>setForm({...form,position:Number(e.target.value)})}/></label></div>
 <label><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> Active</label>
 <div className="field"><label>Description<textarea maxLength={500} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label></div>
 <div className="field"><label>SEO title<input maxLength={70} value={form.seoTitle} onChange={e=>setForm({...form,seoTitle:e.target.value})}/></label></div>
 <div className="field"><label>SEO description<textarea maxLength={160} value={form.seoDescription} onChange={e=>setForm({...form,seoDescription:e.target.value})}/></label></div>
 <button type="submit" className="button" disabled={busy}>Save category</button> {editing&&<button type="button" className="button small light" onClick={()=>{setEditing(null);setForm(empty);}}>Cancel</button>}</form>
 <div style={{overflowX:"auto"}}><table><thead><tr><th>Category</th><th>Parent</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(c=><tr key={c.id}><td>{c.name}<div className="smallprint">{c.slug}</div></td><td>{rows.find(p=>p.id===c.parentId)?.name||"Top level"}</td><td>{c.position}</td><td>{c.active?"Active":"Inactive"}</td><td><button className="button small light" type="button" onClick={()=>edit(c)}>Edit</button> <button className="button small light" type="button" onClick={()=>void remove(c)} disabled={busy}>Delete</button></td></tr>)}</tbody></table></div></section>;
}
