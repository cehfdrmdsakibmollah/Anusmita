import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import OrdersCommandCenter from "@/components/orders-command-center";
import "@/components/orders-command-center.css";
export const dynamic="force-dynamic";
export const metadata={title:"Orders command center | ANUSMITA",robots:{index:false,follow:false}};
export default async function OrdersPage(){
 const user=await currentUser();
 if(!user)redirect("/admin/login");
 if(!["owner","admin","sales","finance","support","analyst"].includes(user.role)||user.permissions?.["orders.view"]===false)redirect("/admin/dashboard");
 const canEdit=["owner","admin","sales"].includes(user.role)&&(user.role==="owner"||user.permissions?.["orders.edit"]!==false);
 return <OrdersCommandCenter canEdit={canEdit}/>;
}
