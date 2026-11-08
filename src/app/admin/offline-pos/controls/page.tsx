import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import PosFinanceControls from "@/components/pos-finance-controls";
import "@/components/pos-finance-controls.css";
export const dynamic="force-dynamic";
export const metadata={title:"POS Commission & Reconciliation Controls | ANUSMITA",robots:{index:false,follow:false}};
export default async function Page(){
 const user=await currentUser();
 if(!user)redirect("/admin/login");
 if(!["owner","admin","finance","analyst"].includes(user.role)||user.permissions?.["finance.view"]===false)redirect("/admin/dashboard");
 return <PosFinanceControls canManage={user.role==="owner"||(user.role==="admin"&&user.permissions?.["finance.edit"]!==false)}/>;
}
