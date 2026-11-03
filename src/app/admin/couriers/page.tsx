import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import CourierCommandCenter from "@/components/courier-command-center";
import "@/components/erp-admin-sidebar.css";
import "@/components/courier-command-center.css";
export const dynamic="force-dynamic";
export const metadata={title:"Courier Setup & Logistics Hub | ANUSMITA",robots:{index:false,follow:false}};
export default async function Page(){
 const user=await currentUser();
 if(!user)redirect("/admin/login");
 if(!["owner","admin","sales","support","analyst"].includes(user.role)||user.permissions?.["orders.view"]===false)redirect("/admin/dashboard");
 return <CourierCommandCenter adminName={user.name} canSync={["owner","admin","sales","support"].includes(user.role)}/>;
}