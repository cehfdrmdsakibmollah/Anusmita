"use client";
import {useState} from "react";

export function FunnelAttributionControl({slug,enabledForPage}:{slug:string;enabledForPage:boolean}){
 const [enabled,setEnabled]=useState(enabledForPage);
 const [pending,setPending]=useState(false);
 const [message,setMessage]=useState("");
 async function update(allow:boolean){
  setPending(true);
  setMessage("");
  try{
   const response=await fetch("/api/funnel-attribution?slug="+encodeURIComponent(slug),{method:allow?"POST":"DELETE"});
   if(!response.ok)throw new Error("Unable to update the preference. Please retry.");
   setEnabled(allow);
   setMessage(allow?"Order attribution is enabled for this campaign for 24 hours.":"Order attribution is disabled for future orders.");
  }catch(error){setMessage(error instanceof Error?error.message:"Unable to update the preference.");}
  finally{setPending(false);}
 }
 return <section className="anFunnelAttribution" aria-label="Campaign measurement">
  <p>Optional campaign measurement. Allow ANUSMITA to link orders from this browser to this campaign for 24 hours.</p>
  <button type="button" disabled={pending||enabled} onClick={()=>void update(true)}>Allow order attribution</button>
  <button type="button" disabled={pending} onClick={()=>void update(false)}>Turn off attribution</button>
  {message&&<p role="status">{message}</p>}
 </section>;
}
