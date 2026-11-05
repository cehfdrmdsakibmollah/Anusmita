"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {ChevronDown,LogOut,ShieldCheck,UserRound,KeyRound,LayoutDashboard,LoaderCircle} from "lucide-react";
import type {Role} from "@/lib/auth";
type Props={name:string;email:string;role:Role;permissions?:Record<string,boolean>;placement:"top"|"sidebar";};
export default function AdminAccountMenu({name,email,role,permissions,placement}:Props){
 const [open,setOpen]=useState(false),[loggingOut,setLoggingOut]=useState(false),[error,setError]=useState("");
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!open)return;
  const dismiss=(e:PointerEvent)=>{if(root.current&&!root.current.contains(e.target as Node))setOpen(false)};
  const escape=(e:KeyboardEvent)=>{if(e.key==="Escape"){setOpen(false);root.current?.querySelector<HTMLButtonElement>(".anAccountTrigger")?.focus();}};
  window.addEventListener("pointerdown",dismiss);window.addEventListener("keydown",escape);
  return()=>{window.removeEventListener("pointerdown",dismiss);window.removeEventListener("keydown",escape);};
 },[open]);
 async function logout(){
  if(loggingOut)return;
  setLoggingOut(true);setError("");
  try{
   const response=await fetch("/api/auth/logout",{method:"POST",credentials:"same-origin",cache:"no-store"});
   if(!response.ok)throw Error("Unable to sign out. Please retry.");
   // Replace rather than push, so the logout page cannot be recovered via Back.
   window.location.replace("/admin/login");
  }catch(e){
   setError(e instanceof Error?e.message:"Logout failed");
   setLoggingOut(false);
  }
 }
 const roleName=role==="owner"?"Owner / Super Admin":role==="admin"?"Administrator":role[0].toUpperCase()+role.slice(1);
 return <div className={"anAccountMenu anAccountMenu-"+placement} ref={root}>
  <button className="anAccountTrigger" type="button" aria-haspopup="menu" aria-expanded={open} aria-label={"Account menu for "+name} onClick={()=>{setOpen(v=>!v);setError("");}}>
   <span className="anAccountAvatar" aria-hidden>{name.trim().charAt(0).toUpperCase()||"A"}</span>
   <span className="anAccountTriggerCopy"><strong>{name}</strong>{placement==="sidebar"&&<small>{roleName}</small>}</span><ChevronDown size={15} className={open?"anAccountRotated":""}/>
  </button>
  {open&&<div className="anAccountPopover" role="menu" aria-label="Account actions">
   <div className="anAccountIdentity"><span className="anAccountAvatar anAccountAvatarLarge">{name.trim().charAt(0).toUpperCase()||"A"}</span><div><strong>{name}</strong><small>{email}</small><span className="anAccountRole"><ShieldCheck size={12}/>{roleName}</span></div></div>
   <div className="anAccountMenuItems">
    <Link role="menuitem" href="/admin/staff?section=profile" onClick={()=>setOpen(false)}><UserRound size={16}/> My Profile <span>›</span></Link>
    <Link role="menuitem" href="/admin/dashboard" onClick={()=>setOpen(false)}><LayoutDashboard size={16}/> Dashboard <span>›</span></Link>
    <Link role="menuitem" href="/admin/staff?section=profile" onClick={()=>setOpen(false)}><KeyRound size={16}/> Account Settings <span>›</span></Link>
    <div className="anAccountPermission"><ShieldCheck size={14}/><span>Product editing: {role==="owner"||(["admin","inventory"].includes(role)&&permissions?.["products.edit"]!==false)?"Allowed":"Restricted"}</span></div>
   </div>
   {error&&<p role="alert" className="anAccountError">{error}</p>}
   <button type="button" role="menuitem" className="anAccountLogout" disabled={loggingOut} onClick={()=>void logout()}>
    {loggingOut?<LoaderCircle size={16} className="anAccountSpinner"/>:<LogOut size={16}/>}
    {loggingOut?"Signing out…":"Log out"}
   </button>
  </div>}
 </div>;
}
