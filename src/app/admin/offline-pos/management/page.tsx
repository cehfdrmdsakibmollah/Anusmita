import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import PosOperations from "@/components/pos-operations";
import "@/components/pos-operations.css";
export const dynamic="force-dynamic";
export const metadata={title:"Branch & Damage Management | ANUSMITA POS",robots:{index:false,follow:false}};
export default async function PosOperationsPage(){
 const user=await currentUser();if(!user)redirect("/admin/login");
 if(!["owner","admin","inventory"].includes(user.role)||user.permissions?.["inventory.view"]===false)redirect("/admin/dashboard");
 return <PosOperations canEdit={user.role==="owner"||user.permissions?.["inventory.edit"]!==false} canManageBranches={["owner","admin"].includes(user.role)&&(user.role==="owner"||user.permissions?.["inventory.edit"]!==false)}/>;
}
