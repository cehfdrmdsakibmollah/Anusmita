
"use client";
export default function LogoutButton(){
 async function logout(){
  try {await fetch("/api/auth/logout",{method:"POST",headers:{"Content-Type":"application/json"}});} finally{window.location.assign("/admin/login");}
 }
 return <button type="button" className="button light small" onClick={logout}>Log out</button>;
}
