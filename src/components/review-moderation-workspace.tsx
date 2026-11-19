"use client";
import {useEffect,useState} from "react";
type Review={id:string;productId:string;orderId:string;rating:number;body:string;skinType:string;createdAt:string};
export default function ReviewModerationWorkspace({canApprove}:{canApprove:boolean}){
 const [reviews,setReviews]=useState<Review[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [pending,setPending]=useState(""),[orderId,setOrderId]=useState(""),[productId,setProductId]=useState(""),[inviteUrl,setInviteUrl]=useState("");
 async function refresh(){
  setLoading(true);setError("");
  try{const res=await fetch("/api/admin/product-reviews",{cache:"no-store"});const json=await res.json();if(!res.ok)throw new Error(json.error||"Could not load reviews");setReviews(json.reviews||[]);}
  catch(e){setError(e instanceof Error?e.message:"Unable to load reviews");}
  finally{setLoading(false);}
 }
 useEffect(()=>{void refresh();},[]);
 async function moderate(id:string,decision:"approved"|"rejected"){
  if(!canApprove||pending)return;setPending(id);setError("");setMessage("");
  try{
   const res=await fetch("/api/admin/product-reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reviewId:id,decision})});
   const data=await res.json();if(!res.ok)throw new Error(data.error||"Moderation failed");
   setMessage("Review "+decision+".");await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not moderate review");}
  finally{setPending("");}
 }
 async function createInvite(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(pending)return;
  setPending("invite");setInviteUrl("");setError("");setMessage("");
  try{
   const res=await fetch("/api/admin/review-invitations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:orderId.trim(),productId:productId.trim()})});
   const data=await res.json();if(!res.ok)throw new Error(data.error||"Unable to create invitation");
   setInviteUrl(data.reviewUrl);setMessage("A seven-day invitation was created. Share this link only with the verified purchaser.");
  }catch(e){setError(e instanceof Error?e.message:"Could not create invitation");}
  finally{setPending("");}
 }
 const card:React.CSSProperties={background:"#fff",border:"1px solid #eadbdd",borderRadius:14,padding:22};
 const field:React.CSSProperties={width:"100%",minWidth:0,padding:12,border:"1px solid #eadbdd",borderRadius:8};
 const button:React.CSSProperties={padding:"11px 17px",borderRadius:8,border:"1px solid #b63c60",background:"#b63c60",color:"white",cursor:"pointer"};
 return <main style={{maxWidth:1100,margin:"0 auto",padding:"36px 20px 70px",color:"#39242c"}}>
  <p style={{fontSize:12,letterSpacing:"0.12em",color:"#a6385b"}}>ANUSMITA · STORE TRUST</p>
  <h1 style={{fontFamily:"Georgia,serif",fontSize:34,margin:"7px 0"}}>Verified Product Reviews</h1>
  <p style={{color:"#765965",marginBottom:26,lineHeight:1.6}}>Invite customers after delivery, then moderate submitted reviews before they appear in the shop. Reviews are never published automatically.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,340px),1fr))",gap:20}}>
   <section style={card}><h2 style={{fontSize:20,marginBottom:12}}>Create customer invitation</h2>
    <p style={{fontSize:13,color:"#765965",lineHeight:1.5}}>Use the real delivered order ID and a purchased product ID. Check the recipient before sharing the signed link.</p>
    <form onSubmit={createInvite} style={{display:"grid",gap:12,marginTop:16}}>
     <label>Delivered order ID<input required pattern="[a-fA-F0-9]{24}" style={field} value={orderId} onChange={e=>setOrderId(e.target.value)}/></label>
     <label>Purchased product ID<input required pattern="[a-fA-F0-9]{24}" style={field} value={productId} onChange={e=>setProductId(e.target.value)}/></label>
     <button style={button} disabled={Boolean(pending)}>Create invitation</button>
    </form>
    {inviteUrl&&<div style={{overflowWrap:"anywhere",marginTop:16,padding:12,background:"#fff4f6",borderRadius:8}}><strong>Private invitation URL</strong><p style={{fontSize:12}}>{inviteUrl}</p><button type="button" style={{...button,background:"#fff",color:"#a72d51"}} onClick={()=>navigator.clipboard.writeText(inviteUrl)}>Copy link</button></div>}
   </section>
   <section style={card}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><h2 style={{fontSize:20}}>Pending moderation</h2><button type="button" onClick={()=>void refresh()} disabled={loading} style={{...button,background:"#fff",color:"#a72d51"}}>Refresh</button></div>
    <p style={{fontSize:13,color:"#765965"}}>{loading?"Loading reviews…":reviews.length+" pending review(s)"}</p>
    {reviews.length===0&&!loading&&<p role="status">No reviews awaiting moderation.</p>}
    <div style={{display:"grid",gap:12,marginTop:16}}>{reviews.map(r=><article key={r.id} style={{border:"1px solid #eadbdd",padding:16,borderRadius:10,overflowWrap:"anywhere"}}>
      <strong>{r.rating} / 5 stars</strong><p style={{fontSize:13,lineHeight:1.6,margin:"10px 0"}}>{r.body}</p>
      <small style={{display:"block",color:"#765965",lineHeight:1.5}}>Product: {r.productId}</small><small style={{display:"block",color:"#765965",lineHeight:1.5}}>Order: {r.orderId}</small>
      {canApprove?<div style={{display:"flex",gap:8,marginTop:14}}><button disabled={Boolean(pending)} type="button" style={button} onClick={()=>void moderate(r.id,"approved")}>Approve</button><button disabled={Boolean(pending)} type="button" style={{...button,background:"#fff",color:"#a72d51"}} onClick={()=>void moderate(r.id,"rejected")}>Reject</button></div>:<p>Approval requires editing permission.</p>}
    </article>)}</div>
   </section>
  </div>
  {error&&<p role="alert" style={{color:"#b42346",marginTop:20}}>{error}</p>}
  {message&&<p role="status" style={{color:"#3d6c4b",marginTop:20}}>{message}</p>}
 </main>;
}
