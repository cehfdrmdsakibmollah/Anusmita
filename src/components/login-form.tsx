
"use client";
import {useState} from "react";
export default function LoginForm(){
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[loading,setLoading]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError("");
 try{const response=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
 const data=await response.json();if(!response.ok)throw new Error(data.error||"Invalid credentials");
 window.location.assign("/admin");}catch(e){setError(e instanceof Error?e.message:"Login failed");}finally{setLoading(false);}}
 return <form onSubmit={submit}><div className="field"><label htmlFor="email">Email</label><input id="email" type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></div>
 <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></div>
 {error&&<p className="error" role="alert">{error}</p>}<button className="button" style={{width:"100%"}} disabled={loading}>{loading?"Signing in…":"Sign in securely"}</button></form>;
}
