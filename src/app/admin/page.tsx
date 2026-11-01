
import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import AdminConsole from "@/components/admin-console";
import AdminOverview from "@/components/admin-overview";
import "@/components/admin-overview.css";
import "./admin-home.css";
import LogoutButton from "@/components/logout-button";
export const dynamic="force-dynamic";
export const metadata={title:"ANUSMITA Admin",robots:{index:false,follow:false}};
export default async function AdminPage({searchParams}:{searchParams:Promise<{tab?:string}>}){
 const params=await searchParams;
 const user=await currentUser();
 if(!user)redirect("/admin/login");
 if(params.tab==="Product SEO")redirect("/admin/products/seo");
 if(!params.tab){
  if(["owner","admin","finance","analyst"].includes(user.role)&&user.permissions?.["finance.view"]!==false)return <div className="anAdminHome"><AdminOverview name={user.name}/></div>;
  const defaultTab:Record<string,string>={sales:"Orders",inventory:"Inventory",purchasing:"Purchasing",support:"Social Inbox"};
  redirect("/admin?tab="+encodeURIComponent(defaultTab[user.role]||"Orders"));
 }
 return <div className="adminWrap"><div className="adminTitle"><div><p className="eyebrow">ANUSMITA · BUSINESS OPERATIONS</p><h1>Business dashboard</h1><p className="muted">Signed in as {user.name} · {user.role}</p></div><div className="noPrint"><LogoutButton/></div></div>
 <p><a href="/admin/dashboard">Open business overview →</a></p><AdminConsole role={user.role} permissions={user.permissions} initialTab={params.tab}/></div>;
}

