
import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import AdminConsole from "@/components/admin-console";
export const dynamic="force-dynamic";
export const metadata={title:"ERP Dashboard",robots:{index:false,follow:false}};
export default async function AdminPage(){
 const user=await currentUser();
 if(!user)redirect("/admin/login");
 return <div className="adminWrap"><div className="adminTitle"><div><p className="eyebrow">ANUSMITA · BUSINESS OPERATIONS</p><h1>Business dashboard</h1><p className="muted">Signed in as {user.name} · {user.role}</p></div><form action="/api/auth/logout" method="POST" className="noPrint"><Logout/></form></div>
 <AdminConsole role={user.role}/></div>;
}
function Logout(){return <button type="submit" className="button light small" formAction={undefined} onClick={undefined}>Log out</button>;}
