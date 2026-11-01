
"use client";
import {useState} from "react";
import {Mail,LockKeyhole,Eye,EyeOff,ArrowRight} from "lucide-react";
export default function LoginForm(){
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[loading,setLoading]=useState(false),[showPassword,setShowPassword]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError("");
 try{const response=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
 const data=await response.json();if(!response.ok)throw new Error(data.error||"Invalid credentials");
 const role=String(data.role||"");
 const next=["owner","admin","finance","analyst"].includes(role)?"/admin":role==="sales"?"/admin?tab=Orders":role==="inventory"?"/admin?tab=Inventory":role==="purchasing"?"/admin?tab=Purchasing":role==="support"?"/admin?tab=Social%20Inbox":"/admin";
 window.location.assign(next);}catch(e){setError(e instanceof Error?e.message:"Login failed");}finally{setLoading(false);}}
 return <form className="anOwnerLoginForm" onSubmit={submit}>
 <div className="anOwnerLoginField"><label htmlFor="email">Email</label><div className="anOwnerLoginInputWrap"><Mail size={19} aria-hidden="true"/><input id="email" type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></div></div>
 <div className="anOwnerLoginField"><label htmlFor="password">Password</label><div className="anOwnerLoginInputWrap"><LockKeyhole size={19} aria-hidden="true"/><input id="password" type={showPassword?"text":"password"} required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" className="anOwnerLoginReveal" aria-label={showPassword?"Hide password":"Show password"} aria-pressed={showPassword} onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></div>
 {error&&<p className="error" role="alert">{error}</p>}
 <button className="anOwnerLoginSubmit" type="submit" disabled={loading}>{loading?"SIGNING IN…":"SIGN IN SECURELY"} <ArrowRight size={20} aria-hidden="true"/></button>
 </form>;
}
