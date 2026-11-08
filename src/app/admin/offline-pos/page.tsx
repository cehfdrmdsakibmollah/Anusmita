import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import OfflinePosWorkspace from "@/components/offline-pos-workspace";
import "@/components/offline-pos-workspace.css";
export const dynamic="force-dynamic";
export const metadata={title:"Offline POS & Inventory ERP | ANUSMITA",robots:{index:false,follow:false}};
export default async function OfflinePosPage(){
 const user=await currentUser();
 if(!user)redirect("/admin/login");
 if(!["owner","admin","sales"].includes(user.role)||user.permissions?.["orders.view"]===false)redirect("/admin/dashboard");
 return <OfflinePosWorkspace canCheckout={user.role==="owner"||user.permissions?.["orders.edit"]!==false} cashierName={user.name} cashierId={user.id} canDiscount={["owner","admin"].includes(user.role)}/>;
}
