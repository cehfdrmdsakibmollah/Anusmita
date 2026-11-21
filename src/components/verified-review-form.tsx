"use client";
import {useState} from "react";
export default function VerifiedReviewForm({token,productName}:{token:string;productName:string}){
 const [rating,setRating]=useState(5),[body,setBody]=useState(""),[skinType,setSkinType]=useState("");
 const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[done,setDone]=useState(false);
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||done||!consent)return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/reviews",{method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",body:JSON.stringify({token,rating,body,skinType,consentToPublish:consent})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||"Review submission failed");
   setDone(true);
  }catch(e){setError(e instanceof Error?e.message:"Could not submit review");}finally{setBusy(false);}
 }
 return <main style={{maxWidth:650,margin:"48px auto",padding:"24px",background:"#fffaf9",border:"1px solid #efdbdf",borderRadius:16}}>
  <h1 style={{fontFamily:"Georgia,serif",fontSize:30,marginBottom:12}}>Review your verified purchase</h1>
  <p style={{lineHeight:1.6}}>{productName}</p>
  {done?<p role="status">Thank you. Your review was received and is awaiting moderation.</p>:
  <form onSubmit={submit} style={{display:"grid",gap:16,marginTop:22}}>
   <label style={{display:"grid",gap:7}}>Your rating
    <select required value={rating} onChange={e=>setRating(Number(e.target.value))} style={{padding:12,border:"1px solid #dfc8cf",borderRadius:8}}>
     {[5,4,3,2,1].map(n=><option key={n} value={n}>{n} / 5 stars</option>)}
    </select>
   </label>
   <label style={{display:"grid",gap:7}}>Your review (at least 10 characters)
    <textarea required minLength={10} maxLength={1500} rows={6} value={body} onChange={e=>setBody(e.target.value)} style={{padding:12,border:"1px solid #dfc8cf",borderRadius:8}}/>
   </label>
   <label style={{display:"grid",gap:7}}>Skin type (optional)
    <input maxLength={60} value={skinType} onChange={e=>setSkinType(e.target.value)} style={{padding:12,border:"1px solid #dfc8cf",borderRadius:8}}/>
   </label>
   <label style={{display:"flex",gap:10,alignItems:"flex-start"}}><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/>I consent to publishing this review after moderation. My name and order details will not be displayed.</label>
   {error&&<p role="alert" style={{color:"#ac2245"}}>{error}</p>}
   <button disabled={!consent||body.trim().length<10||busy} type="submit" style={{background:"#b63c60",color:"white",border:0,borderRadius:8,padding:14,cursor:"pointer"}}>{busy?"Submitting…":"Submit verified review"}</button>
  </form>}
  <p style={{fontSize:12,color:"#7b6670",marginTop:20}}>One review per product per delivered order. Reviews are published only after approval.</p>
 </main>;
}
