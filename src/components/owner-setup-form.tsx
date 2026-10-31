"use client";
import {useState} from "react";
import Link from "next/link";
export default function OwnerSetupForm({token}:{token:string}){
 const [password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();if(busy)return;setBusy(true);setError("");
  try{const r=await fetch("/api/auth/owner-setup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,password,confirmPassword:confirm})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Setup failed");setDone(true);setPassword("");setConfirm("");window.history.replaceState(null,"","/admin/setup");}
  catch(e){setError(e instanceof Error?e.message:"Setup failed");}finally{setBusy(false);}
 }
 if(done)return <div className="anOwnerLoginPanelInner"><p className="anOwnerLoginEyebrow">OWNER ACCOUNT ACTIVATED</p><h1>Password saved.</h1><p className="anOwnerLoginIntro">Your owner account is ready. Sign in using your email and the password you just created.</p><Link className="anOwnerLoginSubmit" href="/admin/login">GO TO OWNER LOGIN</Link></div>;
 return <div className="anOwnerLoginPanelInner"><p className="anOwnerLoginEyebrow">SECURE OWNER SETUP</p><h1>Set your password.</h1><p className="anOwnerLoginIntro">Use the private link delivered to your email. Choose a new password with at least 14 characters. Never share it with anyone.</p>
 {token?<form className="anOwnerLoginForm" onSubmit={submit}><div className="anOwnerLoginField"><label htmlFor="new-password">New password</label><div className="anOwnerLoginInputWrap"><input id="new-password" type="password" autoComplete="new-password" minLength={14} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)}/></div></div>
 <div className="anOwnerLoginField"><label htmlFor="confirm-password">Confirm password</label><div className="anOwnerLoginInputWrap"><input id="confirm-password" type="password" autoComplete="new-password" minLength={14} maxLength={128} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></div></div>
 {error&&<p role="alert" className="error">{error}</p>}<button className="anOwnerLoginSubmit" disabled={busy||password!==confirm}>{busy?"ACTIVATING…":"ACTIVATE OWNER ACCOUNT"}</button></form>:<p role="alert">Missing setup token. Open the full private link from your email.</p>}
 </div>;
}
