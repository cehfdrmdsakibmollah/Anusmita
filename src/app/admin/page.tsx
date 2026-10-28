
import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import AdminConsole from "@/components/admin-console";
import LogoutButton from "@/components/logout-button";
export const dynamic="force-dynamic";
export const metadata={title:"ERP Dashboard",robots:{index:false,follow:false}};
export default async function AdminPage({searchParams}:{searchParams:Promise<{tab?:string}>}){
 const params=await searchParams;
 const user=await currentUser();
 if(!user)redirect("/admin/login");
 return <div className="adminWrap"><div className="adminTitle"><div><p className="eyebrow">ANUSMITA · BUSINESS OPERATIONS</p><h1>Business dashboard</h1><p className="muted">Signed in as {user.name} · {user.role}</p></div><div className="noPrint"><LogoutButton/></div></div>
 <p><a href="/admin/dashboard">Open business overview →</a></p><AdminConsole role={user.role} initialTab={params.tab}/></div>;
}

