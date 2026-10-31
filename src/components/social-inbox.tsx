"use client";
import {useEffect,useState} from "react";
type Message={id:string;provider:string;senderId:string;text:string;receivedAt:string};
export default function SocialInbox(){
 const [items,setItems]=useState<Message[]>([]),[enabled,setEnabled]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 async function load(){
  setLoading(true);setError("");
  try{
   const res=await fetch("/api/admin/social-inbox",{cache:"no-store"}),body=await res.json();
   if(!res.ok)throw new Error(body.error||"Unable to load inbox");
   setItems(Array.isArray(body.messages)?body.messages:[]);setEnabled(Boolean(body.enabled));
  }catch(e){setError(e instanceof Error?e.message:"Inbox unavailable");}finally{setLoading(false);}
 }
 useEffect(()=>{void load();},[]);
 return <section className="adminCard">
  <h2>Social Inbox — Messenger / Instagram</h2>
  <p className="smallprint">Inbound text only. Requires official Meta app access, approved webhook subscription, server-side signing secret and opt-in enablement. WhatsApp and outbound replies are not connected. Messages automatically expire from storage after 30 days.</p>
  <p className="notice">Integration: {enabled?"Enabled by server setting (not proof of provider connectivity)":"Disabled until verified provider setup"}</p>
  <button type="button" className="button small light" disabled={loading} onClick={()=>void load()}>Refresh inbox</button>
  {loading&&<p role="status">Loading verified inbound records…</p>}
  {error&&<p className="error" role="alert">{error}</p>}
  {items.length?<div style={{overflowX:"auto"}}><table><thead><tr><th>Received</th><th>Channel</th><th>Sender ID</th><th>Message</th></tr></thead><tbody>
   {items.map(m=><tr key={m.id}><td>{new Date(m.receivedAt).toLocaleString("en-BD")}</td><td>{m.provider}</td><td>{m.senderId}</td><td style={{whiteSpace:"pre-wrap",maxWidth:420,overflowWrap:"anywhere"}}>{m.text}</td></tr>)}
  </tbody></table></div>:!loading&&!error?<p className="smallprint">No authenticated inbound messages recorded.</p>:null}
  <p className="smallprint">No message is sent automatically and customer identity is not inferred from a platform sender ID.</p>
 </section>;
}
