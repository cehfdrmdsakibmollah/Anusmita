"use client";
import {useState} from "react";

export function FunnelExperimentEntry({token}:{token:string}){
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 async function enter(allow:boolean){
  setPending(true);
  setError("");
  try{
   const params=new URLSearchParams({token,allow:allow?"yes":"no"});
   const response=await fetch("/api/funnel-experiment?"+params,{method:"POST"});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||"Campaign unavailable");
   window.location.assign(result.url);
  }catch(error){
   setError(error instanceof Error?error.message:"Campaign unavailable");
   setPending(false);
  }
 }
 return <div className="anFunnelAttribution">
  <p>Allow ANUSMITA to measure whether this campaign leads to an order in the next 24 hours.</p>
  <button type="button" disabled={pending} onClick={()=>void enter(true)}>Allow and continue</button>
  <button type="button" disabled={pending} onClick={()=>void enter(false)}>Continue without attribution</button>
  {error&&<p role="alert">{error}</p>}
 </div>;
}
